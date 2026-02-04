import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, goal, industry, teamSize, skipped } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyUserJWT(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const supabase = getAdminClient();

    // 1. Update User Role and completion status
    const { error: userError } = await (supabase as any)
      .from("users")
      .update({ 
        onboarding_role: role || null,
        onboarding_completed: true 
      })
      .eq("id", payload.userId);

    if (userError) {
      console.error("User onboarding update error:", userError);
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
    }

    // 2. Update Organization goals/industry (only if not skipped)
    if (!skipped) {
      const { error: orgError } = await (supabase as any)
        .from("organizations")
        .update({ 
          onboarding_goal: goal || null,
          industry: industry || null,
          monthly_sends_estimate: teamSize || null
        })
        .eq("id", payload.orgId);

      if (orgError) {
        console.error("Org onboarding update error:", orgError);
        return NextResponse.json({ error: "Failed to update organization profile" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
