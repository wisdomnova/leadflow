import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { inngest } from "@/lib/services/inngest";

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
