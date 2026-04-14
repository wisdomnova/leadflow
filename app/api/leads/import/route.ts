import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";
import { inngest } from "@/lib/services/inngest";

// Increase Vercel body size limit for large batch payloads
export const maxDuration = 60; // seconds

const UPSERT_CHUNK = 500; // Supabase safe batch size
const INNGEST_CHUNK = 500; // Inngest event batch limit

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use admin client for DB writes — the auth client's custom JWT is rejected
  // by PostgREST RLS on INSERT (silent failure, returns empty data with no error).
  // Session is already validated above, so this is safe.
  const supabase = getAdminClient();

  try {
    const { leads, list_id } = await req.json();

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
    }

    const MAX_LEADS = 50000;
    if (leads.length > MAX_LEADS) {
      return NextResponse.json({ error: `Maximum ${MAX_LEADS} leads per import` }, { status: 400 });
    }

    // Prepare leads for bulk insert — normalize all field name variants
    const leadsToInsert = leads
      .map((lead: any) => ({
        org_id: context.orgId,
        email: (lead.email || '').trim().toLowerCase(),
        first_name: lead.first_name || lead.firstName || null,
        last_name: lead.last_name || lead.lastName || null,
        company: lead.company || null,
        job_title: lead.job_title || lead.jobTitle || lead.title || null,
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        custom_fields: {
          ...(lead.custom_fields || {}),
          ...(lead.phone ? { phone: lead.phone } : {}),
          ...(lead.linkedin ? { linkedin: lead.linkedin } : {}),
          ...(lead.website ? { website: lead.website } : {}),
          ...(lead.city ? { city: lead.city } : {}),
          ...(lead.state ? { state: lead.state } : {}),
          ...(lead.country ? { country: lead.country } : {}),
        },
        source: "csv",
        status: "new",
      }))
      .filter((l: any) => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email));

    // Deduplicate by email — CSV files often have the same person listed
    // multiple times. PostgreSQL's ON CONFLICT DO UPDATE cannot affect the
    // same row twice in a single statement, causing the entire batch to fail.
    const deduped = new Map<string, any>();
    for (const lead of leadsToInsert) {
      deduped.set(lead.email, lead); // last occurrence wins (most complete data)
    }
    const uniqueLeads = Array.from(deduped.values());

    if (uniqueLeads.length === 0) {
      return NextResponse.json({ error: "No valid leads with email addresses found" }, { status: 400 });
    }

    console.log("[CSV IMPORT] orgId:", context.orgId);
    console.log("[CSV IMPORT] total parsed:", leadsToInsert.length, "unique:", uniqueLeads.length);
    console.log("[CSV IMPORT] sample lead:", JSON.stringify(uniqueLeads[0]));

    // --- Chunked upsert (Supabase PostgREST has a ~1000 row limit) ---
    let totalInserted = 0;
    const allInsertedIds: { id: string; orgId: string }[] = [];

    for (let i = 0; i < uniqueLeads.length; i += UPSERT_CHUNK) {
      const chunk = uniqueLeads.slice(i, i + UPSERT_CHUNK);
      console.log(`[CSV IMPORT] upserting chunk ${i}-${i + chunk.length}...`);
      const { data, error } = await (supabase as any)
        .from("leads")
        .upsert(chunk, {
          onConflict: "org_id,email",
          ignoreDuplicates: false,
        })
        .select("id");

      console.log(`[CSV IMPORT] chunk result — data: ${data?.length ?? 'null'}, error:`, error);

      if (error) {
        console.error(`Upsert chunk ${i}-${i + chunk.length} error:`, error);
        // Continue with remaining chunks — partial success is better than total failure
        continue;
      }

      if (data) {
        totalInserted += data.length;
        for (const row of data) {
          allInsertedIds.push({ id: row.id, orgId: context.orgId });
        }
      }
    }

    console.log("[CSV IMPORT] totalInserted:", totalInserted);

    // --- Assign to list if specified ---
    if (list_id && allInsertedIds.length > 0) {
      const membershipRows = allInsertedIds.map((r) => ({
        list_id,
        lead_id: r.id,
      }));
      for (let i = 0; i < membershipRows.length; i += UPSERT_CHUNK) {
        await (supabase as any)
          .from("lead_list_memberships")
          .upsert(membershipRows.slice(i, i + UPSERT_CHUNK), {
            onConflict: "list_id,lead_id",
            ignoreDuplicates: true,
          });
      }
    }

    // --- Bulk activity log (single batch insert, not N individual calls) ---
    if (allInsertedIds.length > 0) {
      const activityRows = allInsertedIds.map((r) => ({
        org_id: r.orgId,
        action_type: "lead_created",
        description: "Imported via CSV upload",
        metadata: { lead_id: r.id },
      }));

      // Chunk activity inserts too
      for (let i = 0; i < activityRows.length; i += UPSERT_CHUNK) {
        await (supabase as any)
          .from("activity_log")
          .insert(activityRows.slice(i, i + UPSERT_CHUNK))
          .then(({ error }: { error: any }) => {
            if (error) console.error("Activity log batch error:", error);
          });
      }

      // --- Chunked enrichment events (Inngest 512 max per send) ---
      const enrichmentEvents = allInsertedIds.map((r) => ({
        name: "lead/created" as const,
        data: { leadId: r.id, orgId: r.orgId },
      }));

      for (let i = 0; i < enrichmentEvents.length; i += INNGEST_CHUNK) {
        try {
          await inngest.send(enrichmentEvents.slice(i, i + INNGEST_CHUNK) as any);
        } catch (err) {
          console.error(`Inngest enrichment batch ${i} error:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: totalInserted,
      message: `Successfully imported ${totalInserted} leads`,
    });
  } catch (err) {
    console.error("Import request error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
