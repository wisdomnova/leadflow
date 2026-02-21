import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "All";
    const searchQuery = searchParams.get("q") || "";

    // Query unibox_messages — only show conversations from campaign leads
    // Double-check: even if sync let something through, filter here too
    const { data: messages, error } = await (context.supabase as any)
      .from("unibox_messages")
      .select(`
        id,
        message_id,
        from_email,
        sender_name,
        subject,
        snippet,
        received_at,
        is_read,
        direction,
        lead_id,
        leads (
          id,
          first_name,
          last_name,
          email,
          company,
          status,
          tags,
          is_starred,
          sentiment
        )
      `)
      .eq("org_id", context.orgId)
      .not("lead_id", "is", null)
      .order("received_at", { ascending: false });

    if (error) {
      console.error("Unibox API Error:", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // Group messages by conversation key (lead_id if linked, else from_email for inbound)
    const conversationMap = new Map<string, any>();

    for (const msg of (messages || [])) {
      // Determine conversation key
      const lead = msg.leads;
      const convKey = lead?.id || msg.from_email;

      if (!conversationMap.has(convKey)) {
        conversationMap.set(convKey, {
          id: lead?.id || msg.from_email, // Use lead id if available, else email as id
          name: lead
            ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.email
            : msg.sender_name || msg.from_email,
          email: lead?.email || msg.from_email,
          company: lead?.company || "Unknown",
          subject: msg.subject || "(No Subject)",
          preview: msg.snippet || "",
          time: msg.received_at,
          status: lead?.status || "new",
          unread: false,
          avatar: lead?.first_name
            ? lead.first_name[0].toUpperCase()
            : (msg.sender_name ? msg.sender_name[0].toUpperCase() : "?"),
          sentiment: lead?.sentiment || "Neutral",
          isStarred: lead?.is_starred || false,
          tags: lead?.tags || [],
          isLinkedToLead: !!lead,
          messages: []
        });
      }

      const conv = conversationMap.get(convKey)!;
      conv.messages.push({
        id: msg.id,
        sender: msg.direction === 'inbound' ? 'them' : 'you',
        text: msg.snippet,
        time: msg.received_at,
        is_read: msg.is_read
      });

      // Track unread
      if (!msg.is_read && msg.direction === 'inbound') {
        conv.unread = true;
      }
    }

    // Sort messages within each conversation by time ascending
    let formatted = Array.from(conversationMap.values()).map(conv => {
      conv.messages.sort((a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
      );
      // Update preview/time to latest message
      const lastMsg = conv.messages[conv.messages.length - 1];
      if (lastMsg) {
        conv.time = lastMsg.time;
      }
      return conv;
    });

    // Sort conversations by latest message (newest first)
    formatted.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    // Apply Filter (only on lead-linked conversations)
    if (filter !== "All") {
      formatted = formatted.filter((conv: any) => conv.status === filter);
    }

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      formatted = formatted.filter((conv: any) =>
        conv.name.toLowerCase().includes(q) ||
        conv.company.toLowerCase().includes(q) ||
        conv.subject.toLowerCase().includes(q) ||
        conv.email.toLowerCase().includes(q)
      );
    }

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("Unibox Internal Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const context = await getSessionContext();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { leadId, isStarred, status, sentiment, tags } = await req.json();

    const updateData: any = {};
    if (typeof isStarred === 'boolean') updateData.is_starred = isStarred;
    if (status) updateData.status = status;
    if (sentiment) updateData.sentiment = sentiment;
    if (tags) updateData.tags = tags;

    const { error } = await context.supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .eq("org_id", context.orgId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
