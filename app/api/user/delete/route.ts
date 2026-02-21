import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyUserJWT } from "@/lib/jwt";
import { getAdminClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe-billing";

export async function POST(req: Request) {
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

    const { confirm } = await req.json();
    if (confirm !== 'DELETE') {
      return NextResponse.json({ error: "Confirmation required. Type DELETE to confirm." }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Fetch user & org to check ownership
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("id, email, role, org_id")
      .eq("id", payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orgId = (user as any).org_id;

    // 2. Cancel any active Stripe subscription
    const { data: org } = await (supabase as any)
      .from("organizations")
      .select("subscription_id, stripe_customer_id")
      .eq("id", orgId)
      .single();

    if (org?.subscription_id) {
      try {
        await stripe.subscriptions.cancel(org.subscription_id);
      } catch (stripeErr: any) {
        // Don't block deletion if Stripe call fails (sub might already be canceled)
        console.error("Stripe cancel on delete:", stripeErr.message);
      }
    }

    // 3. Check if user is the only member (owner) — if so, delete org data too
    const { count: memberCount } = await (supabase as any)
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    if (memberCount && memberCount <= 1) {
      // This user is the last member — clean up org data
      // Delete in order to respect FK constraints
      await (supabase as any).from("activity_log").delete().eq("org_id", orgId);
      await (supabase as any).from("analytics_daily").delete().eq("org_id", orgId);
      await (supabase as any).from("campaign_recipients").delete().in(
        "campaign_id",
        (await (supabase as any).from("campaigns").select("id").eq("org_id", orgId)).data?.map((c: any) => c.id) || []
      );
      await (supabase as any).from("campaigns").delete().eq("org_id", orgId);
      await (supabase as any).from("leads").delete().eq("org_id", orgId);
      await (supabase as any).from("email_accounts").delete().eq("org_id", orgId);
      await (supabase as any).from("sending_domains").delete().eq("org_id", orgId);
      await (supabase as any).from("smart_servers").delete().eq("org_id", orgId);
      await (supabase as any).from("warmup_stats").delete().eq("org_id", orgId);
    }

    // 4. Delete the user record
    await (supabase as any).from("users").delete().eq("id", payload.userId);

    // 5. If last member, delete the org
    if (memberCount && memberCount <= 1) {
      await (supabase as any).from("organizations").delete().eq("id", orgId);
    }

    // 6. Clear session cookie
    const responseCookies = await cookies();
    responseCookies.delete("session_token");

    return NextResponse.json({ success: true, message: "Account deleted successfully." });
  } catch (err: any) {
    console.error("Account deletion error:", err);
    return NextResponse.json({ error: "Failed to delete account. Please contact support." }, { status: 500 });
  }
}
