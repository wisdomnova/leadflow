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

    // 1. Fetch leads who have messages in unibox_messages
    // We join with unibox_messages to find active conversations
    const { data: leads, error } = await (context.supabase as any)
      .from("leads")
      .select(`
        id,
        first_name,
        last_name,
        email,
        company,
        status,
        tags,
        is_starred,
        sentiment,
        last_message_received_at,
        unibox_messages!lead_id (
          id,
          subject,
          snippet,
          received_at,
          is_read,
          direction,
          message_id
        )
      `)
      .eq("org_id", context.orgId)
      .order("last_message_received_at", { ascending: false });

    if (error) {
      console.error("Unibox API Error:", error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    // 2. Filter and Format for UI
    let formatted = ((leads as any) || [])
      .filter((l: any) => l.unibox_messages && l.unibox_messages.length > 0)
      .map((l: any) => {
        // Sort individual messages by received_at
        const sortedMessages = l.unibox_messages.sort((a: any, b: any) => 
          new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
        );
        
        const lastMsg = sortedMessages[sortedMessages.length - 1];

        return {
          id: l.id,
          name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.email,
          email: l.email,
          company: l.company || "Unknown",
          subject: lastMsg?.subject || "(No Subject)",
          preview: lastMsg?.snippet || "",
          time: lastMsg?.received_at,
          status: l.status,
          unread: l.unibox_messages.some((m: any) => !m.is_read && m.direction === 'inbound'),
          avatar: l.first_name ? l.first_name[0] : (l.email ? l.email[0].toUpperCase() : "?"),
          sentiment: l.sentiment || "Neutral",
          isStarred: l.is_starred || false,
          tags: l.tags || [],
          messages: sortedMessages.map((m: any) => ({
            id: m.id,
            sender: m.direction === 'inbound' ? 'them' : 'you',
            text: m.snippet, // In real app, we might need full body
            time: m.received_at,
            is_read: m.is_read
          }))
        };
      });

    // Apply Filter
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
