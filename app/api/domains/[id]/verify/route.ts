import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import dns from "dns/promises";

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
    // 1. Fetch the domain record
    const { data: domain, error: fetchError } = await context.supabase
      .from("sending_domains")
      .select("*")
      .eq("id", id)
      .eq("org_id", context.orgId)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    const domainName = domain.domain_name;
    const trackingDomain = domain.tracking_domain;
    const selector = domain.dkim_selector || "sig1";

    const results = {
      spf: false,
      dkim: false,
      dmarc: false,
      tracking: false,
    };

    // 2. Check SPF
    try {
      const txtRecords = await dns.resolveTxt(domainName);
      results.spf = txtRecords.some(records => 
        records.some(r => r.includes("v=spf1"))
      );
    } catch (e) {
      console.error(`SPF check failed for ${domainName}`, e);
    }

    // 3. Check DMARC
    try {
      const dmarcRecords = await dns.resolveTxt(`_dmarc.${domainName}`);
      results.dmarc = dmarcRecords.some(records => 
        records.some(r => r.includes("v=DMARC1"))
      );
    } catch (e) {
      console.error(`DMARC check failed for ${domainName}`, e);
    }

    // 4. Check DKIM
    try {
      const dkimRecords = await dns.resolveTxt(`${selector}._domainkey.${domainName}`);
      results.dkim = dkimRecords.length > 0;
    } catch (e) {
      console.error(`DKIM check failed for ${selector}._domainkey.${domainName}`, e);
    }

    // 5. Check Tracking CNAME
    if (trackingDomain) {
      try {
        const cnameRecords = await dns.resolveCname(trackingDomain);
        // In prod, this would be our actual tracking server
        results.tracking = cnameRecords.includes("track.leadflow.com");
      } catch (e) {
        console.error(`Tracking CNAME check failed for ${trackingDomain}`, e);
      }
    }

    // 6. Update Database
    const { error: updateError } = await context.supabase
      .from("sending_domains")
      .update({
        spf_status: results.spf ? "verified" : "failed",
        dkim_status: results.dkim ? "verified" : "failed",
        dmarc_status: results.dmarc ? "verified" : "failed",
        tracking_status: results.tracking ? "verified" : "failed",
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      domain: domainName,
      results
    });

  } catch (err) {
    console.error("Domain verification error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
