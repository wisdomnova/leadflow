import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { logLeadActivity } from "@/lib/activity-utils";

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

    // Prepare leads for bulk insert
    const leadsToInsert = leads.map((lead: any) => ({
      org_id: context.orgId,
      email: lead.email,
      first_name: lead.first_name || lead.firstName || null,
      last_name: lead.last_name || lead.lastName || null,
      company: lead.company || null,
      job_title: lead.job_title || lead.jobTitle || lead.title || null,
      tags: lead.tags || [],
      custom_fields: lead.custom_fields || lead.metadata || {},
      status: "new"
    })).filter((l: any) => l.email);

    if (leadsToInsert.length === 0) {
      return NextResponse.json({ error: "No valid leads with email addresses found" }, { status: 400 });
    }

    // Upsert to handle duplicates if needed, or just insert
    // Using upsert with ON CONFLICT (org_id, email) DO UPDATE
    const { data, error } = await context.supabase
      .from("leads")
      .upsert(leadsToInsert, { 
        onConflict: "org_id,email",
        ignoreDuplicates: false // Set to true if you don't want to update existing leads
      })
      .select();

    if (error) {
      console.error("Bulk import error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activities for each imported lead
    if (data) {
      for (const lead of data) {
        await logLeadActivity({
          supabase: context.supabase,
          leadId: lead.id,
          orgId: context.orgId,
          type: "lead_created",
          description: `Lead imported via CSV: ${lead.email}`
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: data.length, 
      message: `Successfully imported ${data.length} leads` 
    });
  } catch (err) {
    console.error("Import request error:", err);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
