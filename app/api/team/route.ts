import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { resend } from "@/lib/resend";
import { getAdminClient } from "@/lib/supabase";
import crypto from "crypto";

// GET /api/team - List all team members for an organization
export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = getAdminClient();
    // Fetch users (relationship with campaigns is not direct, so we fetch separately or remove for now)
    const { data: users, error } = await (adminClient as any)
      .from("users")
      .select("*")
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch campaigns for the organization to calculate total active if needed
    const { data: campaigns } = await (adminClient as any)
      .from("campaigns")
      .select("id, status")
      .eq("org_id", context.orgId);


    // Fetch Organization details for settings
    const { data: org, error: orgError } = await (adminClient as any)
      .from("organizations")
      .select("*")
      .eq("id", context.orgId)
      .single();

    // Fetch real Audit Logs (removed join with users as FK is missing in schema)
    const { data: logs, error: logsError } = await (adminClient as any)
      .from("activity_log")
      .select("*")
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (orgError) throw orgError;
    if (logsError) throw logsError;

    // Calculate aggregate team stats from real campaign data
    const totalSent = campaigns?.reduce((acc: any, c: any) => acc + (c.sent_count || 0), 0) || 0;
    const totalOpened = campaigns?.reduce((acc: any, c: any) => acc + (c.open_count || 0), 0) || 0;
    const totalReplied = campaigns?.reduce((acc: any, c: any) => acc + (c.reply_count || 0), 0) || 0;

    const avgOpenRateNum = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
    const avgReplyRateNum = totalSent > 0 ? (totalReplied / totalSent) * 100 : 0;

    // Format the response to match the frontend expectations
    const formattedUsers = (users || []).map((u: any) => ({
      id: u.id,
      name: u.full_name || u.email.split('@')[0],
      role: 
        u.role === 'admin' ? 'Admin' : 
        u.role === 'manager' ? 'Manager' : 
        u.role === 'executive' ? 'Account Executive' : 'SDR',
      email: u.email,
      performance: 0, // Will be calculated when user-attribution is added to campaigns
      openRate: "0%",
      replyRate: "0%",
      activeCampaigns: 0, 
      status: (u.is_verified || u.password_hash !== 'INVITED_USER_NO_PASSWORD') ? 'Active' : 'Invited',
      avatar: (u.full_name || u.email).substring(0, 2).toUpperCase(),
      joinedDate: new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }));

    // Map logs (manually finding user from the users array)
    const formattedLogs = (logs || []).map((l: any) => {
      const user = (users || []).find((u: any) => u.id === l.user_id);
      return {
        id: l.id,
        user: (user as any)?.full_name || (user as any)?.email || 'System',
        action: l.description,
        date: new Date(l.created_at).toLocaleString(),
        avatar: (((user as any)?.full_name || 'S').substring(0, 2)).toUpperCase()
      };
    });

    // Calculate aggregate team stats
    const stats = {
      totalMembers: (users || []).length,
      avgReplyRate: `${avgReplyRateNum.toFixed(1)}%`, 
      avgOpenRate: `${avgOpenRateNum.toFixed(1)}%`,
      totalOutbound: totalSent >= 1000 ? `${(totalSent / 1000).toFixed(1)}k` : totalSent.toString(),
      org: {
        name: (org as any)?.name,
        slug: (org as any)?.slug,
        plan: (org as any)?.plan || 'free',
        memberLimit: (org as any)?.plan === 'pro' ? 50 : (org as any)?.plan === 'enterprise' ? 500 : 5,
        joinToken: (org as any)?.join_token,
        autoJoinEnabled: (org as any)?.auto_join_enabled
      },
      logs: formattedLogs
    };

    return NextResponse.json({ members: formattedUsers, stats });
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/team - Invite a new member
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context || context.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can invite new members." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, role, full_name } = body;

    // Map UI roles to DB roles
    const dbRole = 
      role === 'Admin' ? 'admin' : 
      role === 'Manager' ? 'manager' : 
      role === 'Account Executive' ? 'executive' : 'sdr';

    // 1. Generate unique invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteExpires = new Date();
    inviteExpires.setHours(inviteExpires.getHours() + 48); // 48 hour expiry

    // 2. Fetch Org Name for email
    const { data: org } = await (context.supabase as any)
      .from("organizations")
      .select("name")
      .eq("id", context.orgId)
      .single();

    const orgName = (org as any)?.name || "your team";
    const adminSupabase = getAdminClient();

    // 3. Check if user already exists
    const { data: existingUser } = await (adminSupabase as any)
      .from("users")
      .select("id, org_id")
      .eq("email", email)
      .single();

    if (existingUser) {
      if ((existingUser as any).org_id === context.orgId) {
        return NextResponse.json({ error: "This user is already a member of your team." }, { status: 400 });
      } else {
        return NextResponse.json({ error: "A user with this email already exists on Leadflow." }, { status: 400 });
      }
    }

    // 4. Insert user record with token
    const { data: newUser, error } = await (context.supabase as any)
      .from("users")
      .insert([{
        org_id: context.orgId,
        email,
        full_name: full_name || email.split('@')[0],
        role: dbRole,
        password_hash: 'INVITED_USER_NO_PASSWORD', 
        is_verified: false,
        reset_token: inviteToken,
        reset_token_expires: inviteExpires.toISOString()
      }] as any)
      .select()
      .single();

    if (error) throw error;

    // 5. Send Invitation Email via Resend
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}`;
    
    try {
      await resend.emails.send({
        from: 'Leadflow <onboarding@tryleadflow.ai>',
        to: email,
        subject: `Invite: Join ${orgName} on Leadflow`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px; background-color: #ffffff;">
            <div style="margin-bottom: 32px;">
              <img src="https://www.tryleadflow.ai/_next/image?url=%2Fleadflow-black.png&w=256&q=75" alt="Leadflow" style="height: 32px; width: auto;" />
            </div>
            <h1 style="color: #101828; font-size: 24px; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 8px;">Join ${orgName}</h1>
            <p style="color: #667085; font-size: 16px; font-weight: 500; margin-bottom: 32px;">You've been invited to join the <strong>${role}</strong> team at ${orgName} on Leadflow.</p>
            
            <a href="${inviteUrl}" style="display: inline-block; background-color: #745DF3; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(116, 93, 243, 0.2);">Accept Invitation</a>
            
            <p style="color: #98A2B3; font-size: 12px; margin-top: 32px; border-top: 1px solid #f2f4f7; pt: 24px;">This link will expire in 48 hours. If you weren't expecting this, you can ignore this email.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // We don't fail the whole request if email fails, but maybe we should log it
    }

    return NextResponse.json(newUser);
  } catch (error: any) {
    console.error("Error inviting team member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/team?id=... - Remove a member
export async function DELETE(req: Request) {
  const context = await getSessionContext();
  if (!context || context.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can remove team members." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // 1. Check if the user being deleted is an admin
    const adminClient = getAdminClient();
    const { data: targetUser } = await (adminClient as any)
      .from("users")
      .select("role, id")
      .eq("id", userId)
      .eq("org_id", context.orgId)
      .single();

    if ((targetUser as any)?.role === 'admin') {
      return NextResponse.json({ error: "Administrative accounts cannot be removed." }, { status: 403 });
    }

    // 2. Perform deletion
    const { error } = await (context.supabase as any)
      .from("users")
      .delete()
      .eq("id", userId)
      .eq("org_id", context.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/team - Update a member's details
export async function PATCH(req: Request) {
  const context = await getSessionContext();
  if (!context || context.role !== 'admin') {
    return NextResponse.json({ error: "Only admins can edit team members." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, full_name, role } = body;

    const dbRole = 
      role === 'Admin' ? 'admin' : 
      role === 'Manager' ? 'manager' : 
      role === 'Account Executive' ? 'executive' : 'sdr';

    const { error } = await context.supabase
      .from("users")
      .update({
        full_name,
        role: dbRole,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("org_id", context.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
