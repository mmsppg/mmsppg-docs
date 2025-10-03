import { defineMiddleware } from "astro:middleware";
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

// Initialize Directus client
const directus = createDirectus(import.meta.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(import.meta.env.DIRECTUS_TOKEN));

// Cache authorized emails to avoid hitting Directus on every request
let authorizedEmailsCache: string[] = [];
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getAuthorizedEmails(): Promise<string[]> {
  const now = Date.now();
  
  // Return cached emails if still valid
  if (authorizedEmailsCache.length > 0 && now < cacheExpiry) {
    return authorizedEmailsCache;
  }

  try {
    // Fetch members from Directus
    const members = await directus.request(
      readItems('members', {
        fields: ['email'], // Add an 'email' field to your members collection
        filter: {
          status: { _eq: 'active' } // Optional: only get active members
        }
      })
    );

    authorizedEmailsCache = members
      .map((m: any) => m.email?.toLowerCase())
      .filter((email: string) => email); // Remove any null/undefined
    
    cacheExpiry = now + CACHE_DURATION;
    return authorizedEmailsCache;
    
  } catch (error) {
    console.error("Error fetching authorized emails from Directus:", error);
    // Return cached emails even if expired, or empty array
    return authorizedEmailsCache.length > 0 ? authorizedEmailsCache : [];
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/api/auth", "/api/logout"];
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    context.url.pathname.startsWith(route)
  );

  if (!isPublicRoute) {
    // Check for auth cookie
    const authCookie = context.cookies.get("committee_auth");
    
    if (!authCookie) {
      // Not authenticated, redirect to login
      return context.redirect("/login");
    }

    try {
      // Verify the auth token
      const userData = JSON.parse(authCookie.value);
      
      // Get authorized emails from Directus
      const authorizedEmails = await getAuthorizedEmails();
      
      // Check if email is still authorized
      const isAuthorized = authorizedEmails.some(email => 
        email === userData.email.toLowerCase()
      );
      
      if (!isAuthorized) {
        context.cookies.delete("committee_auth", { path: "/" });
        return context.redirect("/login");
      }
      
      // Add user to context
      context.locals.user = userData;
      
    } catch (error) {
      console.error("Auth error:", error);
      context.cookies.delete("committee_auth", { path: "/" });
      return context.redirect("/login");
    }
  }

  return next();
});