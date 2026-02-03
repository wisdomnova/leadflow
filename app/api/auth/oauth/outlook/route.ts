import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

const MS_AUTH_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const CLIENT_ID = process.env.AZURE_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/oauth/outlook/callback`;

export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.redirect(`${APP_URL}/signin?error=session_expired`);
  }

  if (!CLIENT_ID) {
    console.error("Missing Microsoft Client ID");
    return NextResponse.redirect(`${APP_URL}/dashboard/providers?error=misconfigured`);
  }

  const scopes = [
    "openid",
    "email",
    "profile",
    "offline_access",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/Mail.ReadWrite",
    "https://graph.microsoft.com/User.Read"
  ].join(" ");

  const state = Buffer.from(JSON.stringify({ 
    userId: context.userId, 
    orgId: context.orgId 
  })).toString("base64");

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scopes,
    state: state,
    response_mode: "query",
    prompt: "consent"
  });

  return NextResponse.redirect(`${MS_AUTH_URL}?${params.toString()}`);
}
