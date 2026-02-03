import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import crypto from "crypto";
import { resend } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Check if user exists
    const { data: user } = await supabase
      .from("users")
      .select("id, full_name")
      .eq("email", email)
      .single();

    if (!user) {
      // Return success anyway for security reasons (don't leak registered emails)
      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    // 2. Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // 3. Update User
    await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expires: resetExpires.toISOString(),
      })
      .eq("id", user.id);

    // 4. Send Email via Resend
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    
    try {
      await resend.emails.send({
        from: 'LeadFlow <contact@tryleadflow.ai>',
        to: email,
        subject: 'Reset your LeadFlow password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff;">
            <div style="margin-bottom: 32px;">
              <img src="https://www.tryleadflow.ai/_next/image?url=%2Fleadflow-black.png&w=256&q=75" alt="Leadflow" style="height: 32px; width: auto;" />
            </div>
            <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; color: #101828;">Password Reset Request</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #475467; margin-bottom: 24px;">
              Hi ${user.full_name}, we received a request to reset your password. Click the button below to choose a new one.
            </p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #745DF3; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(116, 93, 243, 0.2);">
              Reset Password
            </a>
            <p style="font-size: 14px; color: #475467;">
              If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
            </p>
            <hr style="border: 0; border-top: 1px solid #f2f4f7; margin: 32px 0;" />
            <p style="font-size: 12px; color: #667085;">
              © 2026 Leadflow. All rights reserved.
            </p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send password reset email:", emailErr);
    }

    return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
