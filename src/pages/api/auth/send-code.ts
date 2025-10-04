import type { APIRoute } from "astro";
import { Resend } from "resend";
import { createDirectus, rest, readItems, staticToken } from '@directus/sdk';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const directus = createDirectus(import.meta.env.DIRECTUS_URL)
  .with(rest())
  .with(staticToken(import.meta.env.DIRECTUS_TOKEN));

// Simple in-memory store for codes (in production, use Redis or KV)
const verificationCodes = new Map<string, { code: string; expires: number }>();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check if email is authorized
    const members = await directus.request(
      readItems('members', {
        fields: ['email'],
        filter: {
          email: { _eq: email.toLowerCase() }
        }
      })
    );

    if (members.length === 0) {
      return new Response(
        JSON.stringify({ error: "This email is not authorized to access the committee portal." }), 
        {
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Generate verification code
    const code = generateCode();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store code
    verificationCodes.set(email.toLowerCase(), { code, expires });

    // Send email
    await resend.emails.send({
      from: 'Committee Portal <noreply@modalitymidsussexppg.org>', // Update with your domain
      to: email,
      subject: 'Your Committee Portal Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { width: 64px; height: 64px; margin: 0 auto 20px; background: linear-gradient(135deg, #5B9085, #529F44); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
              .code-box { background: #f8f9fa; border: 2px solid #5B9085; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
              .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #596175; font-family: monospace; }
              .footer { text-align: center; color: #666; font-size: 14px; margin-top: 40px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="color: #596175; margin: 0;">Committee Portal</h1>
                <p style="color: #305A65; margin: 10px 0 0;">MMS PPG Committee Access</p>
              </div>
              
              <p style="color: #596175; font-size: 16px;">Hello,</p>
              <p style="color: #596175; font-size: 16px;">Your verification code for the Committee Portal is:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
              
              <div class="footer">
                <p>MMS PPG Committee Portal</p>
                <p style="margin-top: 10px;">This is an automated message, please do not reply.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error sending code:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send verification code" }), 
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

// Export the verification codes store for use in verify endpoint
export { verificationCodes };