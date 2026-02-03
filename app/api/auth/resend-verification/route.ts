import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT, signVerificationJWT } from "@/lib/jwt";
import { resend } from "@/lib/resend";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const verificationToken = await signVerificationJWT(payload.email);
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`;

    await resend.emails.send({
      from: 'LeadFlow <contact@tryleadflow.ai>',
      to: payload.email,
      subject: 'Verify your LeadFlow account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #101828;">
          <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Verify your email address</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #475467; margin-bottom: 24px;">
            Please click the button below to verify your email address and continue setting up your LeadFlow account.
          </p>
          <a href="${verificationUrl}" style="display: inline-block; background-color: #101828; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-bottom: 24px;">
            Verify Email Address
          </a>
          <hr style="border: 0; border-top: 1px solid #eaecf0; margin: 32px 0;" />
          <p style="font-size: 12px; color: #667085;">
            © 2026 LeadFlow. All rights reserved.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend error:", err);
    return NextResponse.json({ error: "Failed to resend email" }, { status: 500 });
  }
}
