import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  let orgId: string;
  try {
    const decodedState = JSON.parse(atob(state));
    orgId = decodedState.orgId;
  } catch (e) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  const supabase = getAdminClient();

  try {
    let accessToken: string;
    let refreshToken: string | undefined;
    let expiresAt: number | undefined;
    let accountName = "Connected Account";

    if (provider === 'hubspot') {
      const resp = await fetch("https://api.hubapi.com/oauth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: process.env.HUBSPOT_CLIENT_ID!,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
          redirect_uri: process.env.HUBSPOT_REDIRECT_URI!,
          code,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || "HubSpot token exchange failed");
      
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
      expiresAt = Date.now() + data.expires_in * 1000;

      // Optional: Fetch portal info to get account name
      const portalResp = await fetch("https://api.hubapi.com/integrations/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (portalResp.ok) {
        const portalData = await portalResp.json();
        accountName = portalData.portalId ? `HubSpot Portal ${portalData.portalId}` : accountName;
      }
    } else if (provider === 'pipedrive') {
        const resp = await fetch("https://oauth.pipedrive.com/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${btoa(`${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`)}`
            },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.PIPEDRIVE_REDIRECT_URI!,
            }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Pipedrive token exchange failed");

        accessToken = data.access_token;
        refreshToken = data.refresh_token;
        expiresAt = Date.now() + data.expires_in * 1000;
    } else {
      throw new Error("Unsupported provider");
    }

    // Save to DB
    const { error } = await supabase
      .from("crm_integrations")
      .upsert({
        org_id: orgId,
        provider,
        config: {
          accessToken,
          refreshToken,
          expiresAt,
          accountName
        },
        status: 'active',
        last_sync: new Date().toISOString()
      }, { onConflict: 'org_id,provider' });

    if (error) throw error;

    return NextResponse.redirect(new URL("/dashboard/crm?success=true", req.url));
  } catch (error: any) {
    console.error("OAuth Callback Error:", error);
    return NextResponse.redirect(new URL(`/dashboard/crm?error=${encodeURIComponent(error.message)}`, req.url));
  }
}
