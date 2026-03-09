/**
 * HMAC-signed OAuth state parameter utility.
 * Prevents CSRF / state-forgery attacks on OAuth flows.
 */

import { createHmac, timingSafeEqual } from "crypto";

const STATE_SECRET = process.env.JWT_SECRET;

if (!STATE_SECRET) {
  throw new Error("JWT_SECRET environment variable is required for OAuth state signing");
}

interface OAuthStatePayload {
  [key: string]: string;
}

function sign(data: string): string {
  return createHmac("sha256", STATE_SECRET!).update(data).digest("hex");
}

/**
 * Create an HMAC-signed state parameter for OAuth flows.
 * Format: base64(JSON) + "." + hmac(base64(JSON))
 * Includes a timestamp for expiration (10 minute validity).
 */
export function createSignedState(payload: OAuthStatePayload): string {
  const payloadWithTimestamp = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const data = Buffer.from(JSON.stringify(payloadWithTimestamp)).toString("base64url");
  const signature = sign(data);
  return `${data}.${signature}`;
}

/**
 * Verify and decode an HMAC-signed state parameter.
 * Returns null if the signature is invalid or state is malformed.
 */
export function verifySignedState(state: string): OAuthStatePayload | null {
  try {
    const parts = state.split(".");
    if (parts.length !== 2) return null;

    const [data, providedSig] = parts;
    const expectedSig = sign(data);

    // Use timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(providedSig, "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const decoded = JSON.parse(
      Buffer.from(data, "base64url").toString("utf-8")
    );

    // Check expiration (10 minute validity)
    const STATE_MAX_AGE_SECONDS = 600;
    if (decoded.iat && (Math.floor(Date.now() / 1000) - decoded.iat) > STATE_MAX_AGE_SECONDS) {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
