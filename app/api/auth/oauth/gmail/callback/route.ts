import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { getSessionContext } from "@/lib/auth-utils";
import { verifySignedState } from "@/lib/oauth-state";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/oauth/gmail/callback`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=missing_code`);
  }
    
  try {
    // Verify HMAC-signed state
    const statePayload = verifySignedState(state);
    if (!statePayload || !statePayload.orgId) {
      return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=invalid_state`);
    }

    // Verify session matches state (prevents cross-user attacks)
    const context = await getSessionContext();
    if (!context || context.orgId !== statePayload.orgId) {
      return NextResponse.redirect(`${APP_URL}/signin?error=session_expired`);
    }

    const { orgId } = statePayload;

    const tokenResponse = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI
      }).toString()
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed for Gmail OAuth");
      return NextResponse.redirect(`${APP_URL}/dashboard/providers/failed?error=token_exchange`);
    }

    // Get email from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const userData = await userRes.json();
    const email = userData.email;

    const supabase = getAdminClient();
    
    // Check if we already have this account (to preserve existing refresh_token if Google doesn't return a new one)
    const { data: existingAccount } = await (supabase as any)
      .from("email_accounts")
      .select("config")
      .eq("org_id", orgId)
      .eq("email", email)
      .single();

    const existingConfig = existingAccount?.config || {};

    // CRITICAL: Google only returns refresh_token on the FIRST authorization or when prompt=consent.
    // If it's missing, preserve the old one.
    const refreshToken = tokenData.refresh_token || existingConfig.refresh_token;

    if (!refreshToken) {
      console.error("WARNING: No refresh_token available for account. User may need to re-authorize with prompt=consent.");
    }

    // Save to email_accounts
    const { error } = await (supabase as any)
      .from("email_accounts")
      .upsert({
        org_id: orgId,
        email: email,
        provider: "google",
        status: "active",
        config: {
          access_token: tokenData.access_token,
          refresh_token: refreshToken,
          expires_at: Date.now() + tokenData.expires_in * 1000,
          google_id: userData.id
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
