import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";

const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const CLIENT_ID = process.env.AZURE_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/oauth/outlook/callback`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=missing_code`);
  }

  try {
    const { userId, orgId } = JSON.parse(Buffer.from(state, "base64").toString());

    if (!orgId) {
      throw new Error("Missing organization context");
    }

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        scope: "https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/Mail.ReadWrite User.Read"
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed", tokenData);
      return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=token_exchange`);
    }

    // Get email from Microsoft Graph
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    const email = userData.mail || userData.userPrincipalName;

    const supabase = getAdminClient();
    
    // Save to email_accounts
    const { error } = await (supabase as any)
      .from("email_accounts")
      .upsert({
        org_id: orgId,
        email: email,
        provider: "outlook",
        status: "active",
        config: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: Date.now() + tokenData.expires_in * 1000,
          ms_id: userData.id
        }
      }, { onConflict: "org_id, email" });

    if (error) {
      console.error("Database save failed", error);
      return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=db_save`);
    }

    return NextResponse.redirect(`${APP_URL}/dashboard/providers/success`);
  } catch (err) {
    console.error("Callback error", err);
    return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=unhandled`);
  }
}
