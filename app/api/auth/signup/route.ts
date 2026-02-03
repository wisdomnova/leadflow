import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminClient } from "@/lib/supabase";
import { signUserJWT, signVerificationJWT } from "@/lib/jwt";
import { cookies } from "next/headers";
import { processReferral } from "@/lib/affiliate-utils";
import crypto from "crypto";
import { resend } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, orgName, referralCode } = await req.json();

    if (!email || !password || !fullName || !orgName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Create Organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, "-"),
        plan: "free",
        subscription_status: "trialing",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        referral_code: `LF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, // Generate a unique referral code for the new org
      })
      .select()
      .single();

    if (orgError || !org) {
      console.error("Org insertion error:", orgError);
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // 4. Process Referral if code exists
    if (referralCode) {
      try {
        await processReferral(org.id, referralCode);
      } catch (err) {
        console.error("Referral processing error:", err);
      }
    }

    // 5. Create User
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        org_id: org.id,
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        role: "admin",
      })
      .select()
      .single();

    if (userError || !user) {
      console.error("User insertion error:", userError);
      await supabase.from("organizations").delete().eq("id", org.id);
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // 6. Send Verification Email via Resend
    const verificationToken = await signVerificationJWT(email);
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${verificationToken}`;

    try {
      await resend.emails.send({
        from: 'LeadFlow <contact@tryleadflow.ai>', // Should be a verified domain in production
        to: email,
        subject: 'Verify your LeadFlow account',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #101828;">
            <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome to LeadFlow, ${fullName}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #475467; margin-bottom: 24px;">
              Thanks for signing up. Please verify your email address to get started with scaling your outreach.
            </p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #101828; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-bottom: 24px;">
              Verify Email Address
            </a>
            <p style="font-size: 14px; color: #475467;">
              If you didn't create an account, you can safely ignore this email.
            </p>
            <hr style="border: 0; border-top: 1px solid #eaecf0; margin: 32px 0;" />
            <p style="font-size: 12px; color: #667085;">
              © 2026 LeadFlow. All rights reserved.
            </p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
      // We don't fail the whole signup if email fails, but in prod we might want to
    }

    // 7. Generate Session JWT
    const token = await signUserJWT({
      userId: user.id,
      orgId: org.id,
      email: user.email,
      role: "admin",
    });

    // 8. Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return NextResponse.json({ success: true, user: { email: user.email, fullName: user.full_name } });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
