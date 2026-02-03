import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { resend } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    // Direct supabase client with service role since this is a sensitive auth operation
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Find user with this reset_token (acting as invite token)
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("reset_token", token)
      .single();

    if (findError || !user) {
      return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 401 });
    }

    // 2. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Update user: set password, verify them, and clear the token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        is_verified: true,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // 4. Notify admin(s) that the invite was accepted
    try {
      // Get organization details
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", user.org_id)
        .single();

      // Get admins for this organization
      const { data: admins } = await supabase
        .from("users")
        .select("email, full_name")
        .eq("org_id", user.org_id)
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const orgName = org?.name || "your organization";
        const newMemberName = user.full_name || user.email;

        // Send to all admins
        for (const admin of admins) {
          await resend.emails.send({
            from: 'Leadflow <onboarding@tryleadflow.ai>',
            to: admin.email,
            subject: `New Team Member Joined: ${newMemberName}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff;">
                <div style="margin-bottom: 32px;">
                  <img src="https://www.tryleadflow.ai/_next/image?url=%2Fleadflow-black.png&w=256&q=75" alt="Leadflow" style="height: 32px; width: auto;" />
                </div>
                <h1 style="color: #101828; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 8px;">New Member Alert</h1>
                <p style="color: #667085; font-size: 16px; font-weight: 500; margin-bottom: 32px;"><strong>${newMemberName}</strong> has successfully accepted the invitation and joined <strong>${orgName}</strong> on Leadflow.</p>
                
                <div style="background-color: #f9fafb; padding: 20px; border-radius: 12px; margin-bottom: 32px;">
                  <p style="margin: 0; color: #101828; font-size: 14px; font-weight: 600;">Email: ${user.email}</p>
                  <p style="margin: 4px 0 0 0; color: #667085; font-size: 14px;">Role: ${user.role === 'admin' ? 'Admin' : 'SDR'}</p>
                </div>

                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/team" style="display: inline-block; background-color: #745DF3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(116, 93, 243, 0.2);">Manage Team</a>
                
                <p style="color: #98A2B3; font-size: 12px; margin-top: 32px; border-top: 1px solid #f2f4f7; pt: 24px;">© 2026 Leadflow. All rights reserved.</p>
              </div>
            `
          });
        }
      }
    } catch (notifyError) {
      console.error("Failed to notify admins of join:", notifyError);
      // Don't fail the whole request
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error accepting invite:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
