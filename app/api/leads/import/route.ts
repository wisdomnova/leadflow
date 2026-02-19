import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
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

  try {
    const { leads } = await req.json();

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: "No leads provided" }, { status: 400 });
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
        status: "new",
      }))
      .filter((l: any) => l.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email));

    if (leadsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid leads with email addresses found" }, { status: 400 });
    }

    // --- Chunked upsert (Supabase PostgREST has a ~1000 row limit) ---
    let totalInserted = 0;
    const allInsertedIds: { id: string; orgId: string }[] = [];

    for (let i = 0; i < leadsToInsert.length; i += UPSERT_CHUNK) {
      const chunk = leadsToInsert.slice(i, i + UPSERT_CHUNK);
      const { data, error } = await context.supabase
        .from("leads")
        .upsert(chunk, {
          onConflict: "org_id,email",
          ignoreDuplicates: false,
        })
        .select("id");

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

    // --- Bulk activity log (single batch insert, not N individual calls) ---
    if (allInsertedIds.length > 0) {
      const activityRows = allInsertedIds.map((r) => ({
        org_id: r.orgId,
        lead_id: r.id,
        action_type: "lead_created",
        description: "Imported via CSV upload",
      }));

      // Chunk activity inserts too
      for (let i = 0; i < activityRows.length; i += UPSERT_CHUNK) {
        await context.supabase
          .from("activity_log")
          .insert(activityRows.slice(i, i + UPSERT_CHUNK) as any)
          .then(({ error }) => {
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
