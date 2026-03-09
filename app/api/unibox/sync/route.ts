import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { inngest } from "@/lib/services/inngest";
import { checkSubscription } from "@/lib/subscription-check";
import { rateLimiters } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit sync requests to prevent abuse
  const rl = rateLimiters.emailSync(context.userId);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many sync requests. Please wait." }, { status: 429 });
  }

  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  try {
    // Fetch all accounts for the org
    const { data: accounts } = await context.supabase
      .from("email_accounts")
      .select("id")
      .eq("org_id", context.orgId)
      .eq("status", "active");

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: "No active accounts to sync" });
    }

    // Trigger Inngest sync for each account
    for (const account of accounts) {
      await inngest.send({
        name: "unibox/account.sync",
        data: { accountId: account.id }
      });
    }

    return NextResponse.json({ success: true, count: accounts.length });
  } catch (err: any) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
