import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret-for-dev-only-change-in-prod";
const secret = new TextEncoder().encode(JWT_SECRET);

export interface UserPayload {
  userId: string;
  orgId: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Signs a JWT specifically for Custom Auth + Supabase RLS.
 * It includes an 'org_id' claim which we will use in Supabase Policies.
 */
export async function signUserJWT(payload: UserPayload) {
  return await new SignJWT({
    ...payload,
    // Custom claim for Supabase RLS
    org_id: payload.orgId, 
    // We override regular Supabase 'role' to 'authenticated' to avoid DB errors,
    // and put the app-level role in 'app_role'
    role: 'authenticated',
    app_role: payload.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

/**
 * Signs a short-lived token specifically for email verification.
 */
export async function signVerificationJWT(email: string) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("48h") // 48 hours for verification
    .sign(secret);
}

/**
 * Verifies the verification token.
 */
export async function verifyVerificationJWT(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as { email: string };
  } catch (err) {
    return null;
  }
}

/**
 * Verifies the JWT and returns the payload.
 */
export async function verifyUserJWT(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as UserPayload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}
