import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { classifyReply } from "@/lib/services/ai";
import { rateLimiters } from "@/lib/rate-limit";

// POST /api/unibox/classify — Classify (or re-classify) a conversation
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit AI classification requests
  const rl = rateLimiters.ai(context.userId);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many classification requests. Please wait." }, { status: 429 });
  }

  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    // 1. Fetch latest inbound messages for this lead
    const { data: messages, error: msgError } = await (context.supabase as any)
      .from("unibox_messages")
      .select("snippet, subject")
      .eq("lead_id", leadId)
      .eq("org_id", context.orgId)
      .eq("direction", "inbound")
      .order("received_at", { ascending: false })
      .limit(5);

    if (msgError || !messages || messages.length === 0) {
      return NextResponse.json({ error: "No inbound messages found for this lead" }, { status: 404 });
    }

    // 2. Fetch lead info for context
    const { data: lead } = await context.supabase
      .from("leads")
      .select("first_name, last_name, company")
      .eq("id", leadId)
      .eq("org_id", context.orgId)
      .single();

    // Combine recent messages into a single text for classification
    const replyText = messages
      .map((m: any) => m.snippet)
      .reverse()
      .join("\n\n");

    // 3. Run AI classification
    const result = await classifyReply({
      replyText,
      originalSubject: messages[0]?.subject || undefined,
      leadName: lead ? `${(lead as any).first_name || ''} ${(lead as any).last_name || ''}`.trim() : undefined,
      campaignContext: undefined,
    });

    // 4. Update lead status with the classification
    const { error: updateError } = await context.supabase
      .from("leads")
      .update({
        status: result.classification,
        sentiment: result.classification === "Interested" || result.classification === "Closed Won"
          ? "Positive"
          : result.classification === "Not Interested"
          ? "Negative"
          : "Neutral",
      })
      .eq("id", leadId)
      .eq("org_id", context.orgId);

    if (updateError) {
      console.error("Failed to update lead classification:", updateError);
      return NextResponse.json({ error: "Failed to save classification" }, { status: 500 });
    }

    return NextResponse.json({
      classification: result.classification,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });
  } catch (err: any) {
    console.error("Classification error:", err);
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
}
