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
    const { email, password, fullName, orgName, referralCode, fingerprint } = await req.json();

    if (!email || !password || !fullName || !orgName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Capture anti-abuse signals from request
    const signupIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '0.0.0.0';
    const signupUserAgent = req.headers.get('user-agent') || '';

    const supabase = getAdminClient();

    // 1. Check if user already exists
    const { data: existingUser } = await (supabase as any)
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
    const { data: org, error: orgError } = await (supabase as any)
      .from("organizations")
      .insert([{
        name: orgName,
        slug: orgName.toLowerCase().replace(/\s+/g, "-"),
        plan: "free",
        subscription_status: "trialing",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        referral_code: `LF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`, // Generate a unique referral code for the new org
      }] as any)
      .select()
      .single();

    if (orgError || !org) {
      console.error("Org insertion error:", orgError);
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    // 4. Process Referral if code exists
    if (referralCode) {
      try {
        await processReferral((org as any).id, referralCode, {
          email,
          ip: signupIp,
          fingerprint: fingerprint || null,
          userAgent: signupUserAgent,
        });
      } catch (err) {
        console.error("Referral processing error:", err);
      }
    }

    // 5. Create User
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .insert([{
        org_id: (org as any).id,
        email,
        password_hash: hashedPassword,
        full_name: fullName,
        role: "admin",
      }] as any)
      .select()
      .single();

    if (userError || !user) {
      console.error("User insertion error:", userError);
      await (supabase as any).from("organizations").delete().eq("id", (org as any).id);
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
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff;">
            <div style="margin-bottom: 32px;">
              <img src="https://www.tryleadflow.ai/_next/image?url=%2Fleadflow-black.png&w=256&q=75" alt="Leadflow" style="height: 32px; width: auto;" />
            </div>
            <h1 style="font-size: 24px; font-weight: 800; margin-bottom: 16px;">Welcome to Leadflow, ${fullName}!</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #475467; margin-bottom: 24px;">
              Thanks for signing up. Please verify your email address to get started with scaling your outreach.
            </p>
            <a href="${verificationUrl}" style="display: inline-block; background-color: #745DF3; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-bottom: 24px; box-shadow: 0 10px 15px -3px rgba(116, 93, 243, 0.2);">
              Verify Email Address
            </a>
            <p style="font-size: 14px; color: #475467;">
              If you didn't create an account, you can safely ignore this email.
            </p>
            <hr style="border: 0; border-top: 1px solid #f2f4f7; margin: 32px 0;" />
            <p style="font-size: 12px; color: #667085;">
              © 2026 Leadflow. All rights reserved.
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
      userId: (user as any).id,
      orgId: (org as any).id,
      email: (user as any).email,
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

    return NextResponse.json({ success: true, user: { email: (user as any).email, fullName: (user as any).full_name } });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
