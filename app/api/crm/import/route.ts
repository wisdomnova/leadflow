import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { CRMService } from "@/lib/services/crm";
import { checkSubscription } from "@/lib/subscription-check";

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sub = await checkSubscription(context.orgId);
  if (!sub.active) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  try {
    const { provider } = await req.json();

    if (!provider || !['hubspot', 'pipedrive', 'salesforce'].includes(provider)) {
      return NextResponse.json({ error: "Valid provider required (hubspot, pipedrive, salesforce)" }, { status: 400 });
    }

    const startTime = Date.now();
    const crmService = new CRMService(context.supabase);

    // Pull contacts from CRM
    const contacts = await crmService.importContacts(context.orgId, provider);

    if (contacts.length === 0) {
      return NextResponse.json({ imported: 0, skipped: 0, message: "No contacts found in CRM" });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Upsert into leads table
    for (const contact of contacts) {
      try {
        const { error } = await (context.supabase as any)
          .from("leads")
          .upsert({
            org_id: context.orgId,
            email: contact.email,
            first_name: contact.first_name,
            last_name: contact.last_name,
            company: contact.company,
            job_title: contact.job_title,
            phone: contact.phone,
            source: provider,
            tags: [provider, 'crm-import'],
            status: 'new'
          }, { onConflict: 'org_id,email', ignoreDuplicates: false });

        if (error) {
          skipped++;
          errors.push(`${contact.email}: ${error.message}`);
        } else {
          imported++;
        }
      } catch (err: any) {
        skipped++;
        errors.push(`${contact.email}: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Log activity
    await (context.supabase as any).from("activity_log").insert([{
      org_id: context.orgId,
      action_type: "crm.import",
      description: `Imported ${imported} contacts from ${provider} (${skipped} skipped)`,
      metadata: {
        provider,
        imported,
        skipped,
        total: contacts.length,
        duration: parseFloat(duration),
        errors: errors.slice(0, 5) // Only log first 5 errors
      }
    }] as any);

    // Update last_sync on the integration
    const integrations = await crmService.getIntegrations(context.orgId);
    const integration = integrations.find(i => i.provider === provider);
    if (integration) {
      await (context.supabase as any)
        .from("crm_integrations")
        .update({ last_sync: new Date().toISOString() })
        .eq("id", integration.id);
    }

    return NextResponse.json({
      imported,
      skipped,
      total: contacts.length,
      duration: parseFloat(duration),
      message: `Successfully imported ${imported} contacts from ${provider}`
    });
  } catch (error: any) {
    console.error("CRM import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
