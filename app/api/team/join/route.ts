import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { resend } from "@/lib/resend";
import { getSessionContext } from "@/lib/auth-utils";

// POST /api/team/join - Handle join or request access
export async function POST(req: Request) {
  try {
    const { slug, token, action } = await req.json();

    if (!slug || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const adminClient = getAdminClient();

    // 1. Verify organization and token
    const { data: org, error: orgError } = await adminClient
      .from("organizations")
      .select("id, name, auto_join_enabled, join_token")
      .eq("slug", slug)
      .eq("join_token", token)
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: "Invalid invitation link" }, { status: 404 });
    }

    const context = await getSessionContext();
    
    // If action is JOIN and auto-join is enabled
    if (action === 'JOIN' && org.auto_join_enabled) {
      if (!context) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }

      // Check if user already in an org
      const { data: user } = await adminClient
        .from("users")
        .select("org_id")
        .eq("id", context.userId)
        .single();

      if (user?.org_id) {
         if (user.org_id === org.id) {
            return NextResponse.json({ success: true, message: "Already a member" });
         }
         return NextResponse.json({ error: "You are already a member of another organization" }, { status: 400 });
      }

      // Add user to org
      const { error: updateError } = await adminClient
        .from("users")
        .update({ org_id: org.id, role: 'sdr' })
        .eq("id", context.userId);

      if (updateError) throw updateError;

      return NextResponse.json({ success: true });
    }

    // If action is REQUEST or auto-join is disabled
    if (action === 'REQUEST' || !org.auto_join_enabled) {
      // Send email to admins
      const { data: admins } = await adminClient
        .from("users")
        .select("email, full_name")
        .eq("org_id", org.id)
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const requesterEmail = context?.email || "A guest user";
        const requesterName = context?.userId ? "A logged-in user" : "Someone";

        for (const admin of admins) {
          await resend.emails.send({
            from: 'Leadflow <onboarding@tryleadflow.ai>',
            to: admin.email,
            subject: `Access Request: ${org.name}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff;">
                <h1 style="color: #101828; font-size: 24px; font-weight: 900; margin-bottom: 8px;">Access Request</h1>
                <p style="color: #667085; font-size: 16px; font-weight: 500; margin-bottom: 32px;"><strong>${requesterEmail}</strong> is requesting to join <strong>${org.name}</strong> on Leadflow.</p>
                <p style="color: #667085; font-size: 14px; margin-bottom: 32px;">You can add them manually from your Team Dashboard.</p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/team" style="display: inline-block; background-color: #101828; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px;">Review Request</a>
              </div>
            `
          });
        }
      }

      return NextResponse.json({ success: true, requested: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: any) {
    console.error("Team join error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
