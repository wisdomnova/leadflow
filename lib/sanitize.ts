/**
 * HTML/input sanitization utilities.
 */

/**
 * Escape HTML special characters to prevent XSS when injecting
 * user-supplied values into HTML email templates.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Sanitize a string for safe use in PostgREST .or() / .ilike() filters.
 * Escapes special Postgres LIKE pattern characters and quotes.
 */
export function sanitizeSearchQuery(query: string): string {
  if (typeof query !== "string") return "";
  // Escape Postgres LIKE wildcards and backslash
  return query
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    // Remove any parentheses/commas that could break .or() filter syntax
    .replace(/[(),]/g, "");
}

/**
 * Validate that a string is a valid UUID v4 format.
 */
export function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    str
  );
}

/**
 * Validate that a URL is safe for redirects.
 * - Only allows http/https protocols
 * - Only allows redirects to the same domain or relative paths
 */
export function isSafeRedirectUrl(url: string): boolean {
  // Allow relative URLs (they stay on the same domain)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  try {
    const parsed = new URL(url);
    
    // Only allow http/https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    // Get allowed hosts from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      // If no app URL configured, only allow relative paths
      return false;
    }

    const allowedHost = new URL(appUrl).hostname;
    
    // Only allow redirects to our own domain
    return parsed.hostname === allowedHost;
  } catch {
    return false;
  }
}
