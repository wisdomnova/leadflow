import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { logLeadActivity } from "@/lib/activity-utils";
import { sanitizeSearchQuery } from "@/lib/sanitize";

const MAX_PAGE_SIZE = 100;
const MAX_IDS_PAGE_SIZE = 5000;

export async function GET(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const source = searchParams.get("source");
  const idsOnly = searchParams.get("ids_only") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = idsOnly
    ? Math.min(parseInt(searchParams.get("limit") || "5000"), MAX_IDS_PAGE_SIZE)
    : Math.min(parseInt(searchParams.get("limit") || "10"), MAX_PAGE_SIZE);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = context.supabase
    .from("leads")
    .select(idsOnly ? "id" : "*", { count: "exact" })
    .eq("org_id", context.orgId)
    .order("created_at", { ascending: false });

  if (status && status !== 'All') {
    query = query.eq("status", status.toLowerCase());
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  if (source) {
    query = query.eq("source", source);
  }

  if (search) {
    const s = sanitizeSearchQuery(search);
    query = query.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%,company.ilike.%${s}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  // For ids_only requests, skip stats (used for bulk selection, not UI rendering)
  if (idsOnly) {
    return NextResponse.json({ leads: data, total: count });
  }

  // Get stats for the overview cards
  const { data: statsData } = await context.supabase
    .from("leads")
    .select("status")
    .eq("org_id", context.orgId);

  const stats = {
    total: statsData?.length || 0,
    new: statsData?.filter(l => l.status === 'new').length || 0,
    in_progress: statsData?.filter(l => l.status === 'in_progress').length || 0,
    replied: statsData?.filter(l => l.status === 'replied').length || 0,
    unsubscribed: statsData?.filter(l => l.status === 'unsubscribed').length || 0,
    bounced: statsData?.filter(l => l.status === 'bounced').length || 0,
  };

  return NextResponse.json({ leads: data, total: count, stats });
}

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, first_name, last_name, company, job_title, tags, custom_fields } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const { data, error } = await (context.supabase as any)
      .from("leads")
      .insert([{
        org_id: context.orgId,
        email,
        first_name,
        last_name,
        company,
        job_title,
        tags: tags || [],
        custom_fields: custom_fields || {},
        status: "new"
      }] as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: "Lead already exists in this organization" }, { status: 400 });
      }
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }

    // Log the activity
    await logLeadActivity({
      supabase: context.supabase,
      leadId: data.id,
      orgId: context.orgId,
      type: 'lead_created',
      description: `Lead created manually: ${data.email}`
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
