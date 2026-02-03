import { NextRequest, NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const REDIRECT_URI = `${APP_URL}/api/auth/oauth/gmail/callback`;

export async function GET(request: NextRequest) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.redirect(`${APP_URL}/signin?error=session_expired`);
  }

  if (!GOOGLE_CLIENT_ID) {
    console.error("Missing GOOGLE_CLIENT_ID");
    return NextResponse.redirect(`${APP_URL}/dashboard/providers?error=misconfigured`);
  }

  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ].join(" ");

  const state = Buffer.from(JSON.stringify({ 
    userId: context.userId, 
    orgId: context.orgId 
  })).toString("base64");

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: scopes,
    state: state,
    access_type: "offline",
    prompt: "consent"
  });

  return NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}
