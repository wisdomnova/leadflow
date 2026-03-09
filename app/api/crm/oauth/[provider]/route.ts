import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { createSignedState } from "@/lib/oauth-state";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = createSignedState({ orgId: context.orgId, provider });

  if (provider === 'hubspot') {
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI;
    const scopes = "crm.objects.contacts.write crm.objects.contacts.read"; // Add more as needed
    
    const url = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    return NextResponse.redirect(url);
  }

  if (provider === 'pipedrive') {
    const clientId = process.env.PIPEDRIVE_CLIENT_ID;
    const redirectUri = process.env.PIPEDRIVE_REDIRECT_URI;
    
    const url = `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&state=${state}`;
    
    return NextResponse.redirect(url);
  }

  if (provider === 'salesforce') {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const redirectUri = process.env.SALESFORCE_REDIRECT_URI;
    const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
    const scopes = "api refresh_token";
    
    const url = `${loginUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
    
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
}
