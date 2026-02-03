import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { sendOutreachEmail } from "@/lib/services/email-sender";

// POST /api/diagnostics - Start a new seed test
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { senderId, subject, bodyHtml } = await req.json();

    // 1. Fetch the sender account
    const { data: account, error: accError } = await context.supabase
      .from("email_accounts")
      .select("*")
      .eq("id", senderId)
      .eq("org_id", context.orgId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ error: "Sender account not found" }, { status: 404 });
    }

    // 2. Fetch the seed list
    const { data: seeds, error: seedError } = await context.supabase
      .from("seed_list")
      .select("*");

    if (seedError || !seeds || seeds.length === 0) {
      return NextResponse.json({ error: "Seed list is empty. Add some seeds first." }, { status: 400 });
    }

    // 3. Create diagnostic record
    const { data: diagnostic, error: diagError } = await context.supabase
      .from("seed_diagnostics")
      .insert({
        org_id: context.orgId,
        sender_id: senderId,
        subject,
        status: 'sending',
        total_seeds: seeds.length,
      })
      .select()
      .single();

    if (diagError) throw diagError;

    // 4. Send the emails (in a real production app, we would use a queue here)
    // For the diagnostic, we send one unique email to the entire seed list
    // We append the diagnostic ID to the subject or body to track it
    const trackedSubject = `${subject} [ref:${diagnostic.id}]`;
    
    const sendPromises = seeds.map(seed => 
      sendOutreachEmail({
        to: seed.email,
        subject: trackedSubject,
        bodyHtml,
        account: account
      }).catch(err => {
        console.error(`Failed to send to seed ${seed.email}`, err);
        return { success: false };
      })
    );

    await Promise.all(sendPromises);

    // 5. Update status to 'polling'
    await context.supabase
      .from("seed_diagnostics")
      .update({ status: 'polling' })
      .eq("id", diagnostic.id);

    return NextResponse.json(diagnostic);

  } catch (error: any) {
    console.error("Diagnostic error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/diagnostics - List all tests
export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await context.supabase
      .from("seed_diagnostics")
      .select(`
        *,
        sender:email_accounts(email, provider)
      `)
      .eq("org_id", context.orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
