import { SignJWT, jwtVerify } from "jose";

// Read JWT_SECRET lazily at call time, NOT at module load time.
// This is critical because Next.js middleware is compiled at build time,
// and module-level code would capture the build-time placeholder value
// instead of the real runtime env var injected by ECS.
function getSecret() {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required. Never use a fallback secret in production.");
  }
  return new TextEncoder().encode(JWT_SECRET);
}

const ISSUER = "leadflow";
const AUDIENCE = "leadflow-app";

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
export async function signUserJWT(payload: UserPayload, expiresIn: string = "4h") {
  return await new SignJWT({
    ...payload,
    type: "session",
    // Custom claim for Supabase RLS
    org_id: payload.orgId, 
    // We override regular Supabase 'role' to 'authenticated' to avoid DB errors,
    // and put the app-level role in 'app_role'
    role: 'authenticated',
    app_role: payload.role
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

/**
 * Signs a short-lived token specifically for email verification.
 */
export async function signVerificationJWT(email: string) {
  return await new SignJWT({ email, type: "verification" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("24h")
    .sign(getSecret());
}

/**
 * Signs a short-lived token specifically for password reset.
 */
export async function signPasswordResetJWT(email: string) {
  return await new SignJWT({ email, type: "password_reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("1h")
    .sign(getSecret());
}

/**
 * Verifies the verification token.
 */
export async function verifyVerificationJWT(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if ((payload as any).type !== "verification") return null;
    return payload as unknown as { email: string };
  } catch {
    return null;
  }
}

/**
 * Verifies a password reset token.
 */
export async function verifyPasswordResetJWT(token: string): Promise<{ email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if ((payload as any).type !== "password_reset") return null;
    return payload as unknown as { email: string };
  } catch {
    return null;
  }
}

/**
 * Verifies the JWT and returns the payload.
 */
export async function verifyUserJWT(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if ((payload as any).type !== "session") return null;
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}
