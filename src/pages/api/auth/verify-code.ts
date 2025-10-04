import type { APIRoute } from "astro";

// Simple in-memory store (shared with send-code.ts)
const verificationCodes = new Map<string, { code: string; expires: number }>();

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "Email and code are required" }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const storedData = verificationCodes.get(email.toLowerCase());

    if (!storedData) {
      return new Response(
        JSON.stringify({ error: "No verification code found. Please request a new code." }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Check if code has expired
    if (Date.now() > storedData.expires) {
      verificationCodes.delete(email.toLowerCase());
      return new Response(
        JSON.stringify({ error: "Verification code has expired. Please request a new code." }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Verify code
    if (storedData.code !== code) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code. Please try again." }), 
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Code is valid - delete it and create session
    verificationCodes.delete(email.toLowerCase());

    // Set auth cookie
    cookies.set("committee_auth", JSON.stringify({ email: email.toLowerCase() }), {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error verifying code:", error);
    return new Response(
      JSON.stringify({ error: "Failed to verify code" }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};