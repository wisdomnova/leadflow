import { cookies } from "next/headers";
import { verifyUserJWT } from "./jwt";
import { createAuthClient } from "./supabase";

export async function getSessionContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) return null;

  const payload = await verifyUserJWT(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    orgId: payload.orgId,
    email: payload.email,
    role: payload.role,
    supabase: createAuthClient(token),
  };
}
