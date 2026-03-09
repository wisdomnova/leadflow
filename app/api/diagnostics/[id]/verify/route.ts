import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { ImapFlow } from "imapflow";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch diagnostic
    const { data: diagnostic, error: diagError } = await context.supabase
      .from("seed_diagnostics")
      .select("*")
      .eq("id", id)
      .eq("org_id", context.orgId)
      .single();

    if (diagError || !diagnostic) {
      return NextResponse.json({ error: "Diagnostic not found" }, { status: 404 });
    }

    // 2. Fetch seed list
    const { data: seeds, error: seedError } = await context.supabase
      .from("seed_list")
      .select("*");

    if (seedError || !seeds) throw seedError;

    // 3. For each seed, check its inbox/spam via IMAP
    // WARNING: This currently returns SIMULATED results because real IMAP
    // credentials for seed accounts are not configured. Do NOT show these
    // results to users as real deliverability data.
    // TODO: Implement real IMAP verification with seed account credentials.
    
    const results = await Promise.all(seeds.map(async (seed) => {
      // SIMULATED — replace with real IMAP check when credentials are available
      const folders = ['INBOX', 'Spam', 'Promotions'];
      const randomFolder = folders[Math.floor(Math.random() * folders.length)];
      
      return {
        email: seed.email,
        folder: randomFolder,
        provider: seed.provider,
        verified_at: new Date().toISOString(),
        simulated: true  // Flag to indicate this is not real data
      };
    }));

    // 4. Calculate stats
    const stats = {
      inbox_count: results.filter(r => r.folder === 'INBOX').length,
      spam_count: results.filter(r => r.folder === 'Spam').length,
      promotions_count: results.filter(r => r.folder === 'Promotions').length,
    };

    // 5. Update Record
    const { data: updated, error: updateError } = await context.supabase
      .from("seed_diagnostics")
      .update({
        status: 'completed',
        inbox_count: stats.inbox_count,
        spam_count: stats.spam_count,
        promotions_count: stats.promotions_count,
        results: results,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updated);

  } catch (error: any) {
    console.error("Diagnostic verify error:", error);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
