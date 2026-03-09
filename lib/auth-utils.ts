import { cookies } from "next/headers";
import { verifyUserJWT, UserPayload } from "./jwt";
import { createAuthClient } from "./supabase";

export interface SessionContext {
  userId: string;
  orgId: string;
  email: string;
  role: "admin" | "user";
  supabase: ReturnType<typeof createAuthClient>;
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) return null;

  const payload = await verifyUserJWT(token);
  if (!payload) return null;

  const appRole = ((payload as any).app_role as "admin" | "user") || "user";

  return {
    userId: payload.userId,
    orgId: payload.orgId,
    email: payload.email,
    role: appRole,
    supabase: createAuthClient(token),
  };
}
