import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";

/**
 * POST /api/accounts/bulk
 * Bulk import SMTP email accounts.
 * 
 * Supports two modes:
 *   Mode A (recommended): Use provider defaults — CSV only needs credentials.
 *     Body: { csv: string, providerId: UUID }
 *     CSV columns: email, password, from_name (optional)
 *     SMTP/IMAP settings are inherited from the smtp_providers row.
 * 
 *   Mode B (override): Custom per account — CSV includes full SMTP/IMAP config.
 *     Body: { csv: string } (no providerId)
 *     CSV columns: email, smtp_host, smtp_port, smtp_user, smtp_pass, imap_host, imap_port, imap_user, imap_pass
 * 
 *   Or programmatic: { accounts: Array<{email, password, ...}>, providerId?: UUID }
 */
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const adminSupabase = getAdminClient();
    const providerId: string | null = body.providerId || null;

    // If a provider ID was given, fetch its defaults
    let providerDefaults: any = null;
    if (providerId) {
      const { data: provider } = await adminSupabase
        .from("smtp_providers")
        .select("*")
        .eq("id", providerId)
        .eq("org_id", context.orgId)
        .single();

      if (!provider) {
        return NextResponse.json({ error: "SMTP provider not found" }, { status: 404 });
      }
      providerDefaults = provider;
    }

    let accountRows: any[] = [];

    if (body.csv) {
      accountRows = parseCSV(body.csv, context.orgId, providerId, providerDefaults);
    } else if (body.accounts && Array.isArray(body.accounts)) {
      accountRows = body.accounts.map((a: any) => {
        const hasOverride = !!(a.smtpHost || a.smtp_host);
        return {
          org_id: context.orgId,
          email: a.email,
          provider: 'custom_smtp',
          status: 'active',
          smtp_provider_id: providerId || null,
          config: hasOverride ? {
            smtpHost: a.smtpHost || a.smtp_host || '',
            smtpPort: a.smtpPort || a.smtp_port || '465',
            smtpUser: a.smtpUser || a.smtp_username || a.email,
            smtpPass: a.smtpPass || a.smtp_password || a.password || '',
            imapHost: a.imapHost || a.imap_host || '',
            imapPort: a.imapPort || a.imap_port || '993',
            imapUser: a.imapUser || a.imap_username || a.email,
            imapPass: a.imapPass || a.imap_password || a.password || '',
          } : {
            smtpUser: a.smtpUser || a.smtp_username || a.username || a.email,
            smtpPass: a.smtpPass || a.smtp_password || a.password || '',
            imapUser: a.imapUser || a.imap_username || a.username || a.email,
            imapPass: a.imapPass || a.imap_password || a.password || '',
          },
          from_name: a.from_name || a.display_name || a.email.split('@')[0],
        };
      });
    } else {
      return NextResponse.json({ error: "Missing csv or accounts data" }, { status: 400 });
    }

    if (accountRows.length === 0) {
      return NextResponse.json({ error: "No valid accounts found in the data" }, { status: 400 });
    }

    // Filter out any accounts that already exist for this org
    const emails = accountRows.map(a => a.email);
    const { data: existing } = await adminSupabase
      .from("email_accounts")
      .select("email")
      .eq("org_id", context.orgId)
      .in("email", emails);

    const existingEmails = new Set((existing || []).map((e: any) => e.email));
    const newAccounts = accountRows.filter(a => !existingEmails.has(a.email));
    const skipped = accountRows.length - newAccounts.length;

    if (newAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped,
        total: accountRows.length,
        message: `All ${accountRows.length} accounts already exist`,
      });
    }

    const { data: inserted, error: insertError } = await (adminSupabase as any)
      .from("email_accounts")
      .insert(newAccounts)
      .select();

    if (insertError) {
      console.error("Bulk insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imported: (inserted || []).length,
      skipped,
      total: accountRows.length,
      message: `${(inserted || []).length} account${(inserted || []).length !== 1 ? 's' : ''} imported${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`,
    });
  } catch (err: any) {
    console.error("Bulk import error:", err);
    return NextResponse.json({ error: err.message || "Invalid request" }, { status: 400 });
  }
}


// ---- CSV Parser ----
function parseCSV(csvString: string, orgId: string, providerId: string | null, _providerDefaults: any): any[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s\-]+/g, '_'));
  const rows: any[] = [];

  // Detect mode: if CSV has smtp_host/smtp_server column, it's Mode B (override)
  const hasSmtpHostCol = headers.some(h => ['smtp_host', 'smtp_server'].includes(h));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length < 1) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });

    const email = row['email'] || row['email_address'] || row['mail'] || '';
    if (!email || !email.includes('@')) continue;

    const password = row['password'] || row['app_password'] || row['smtp_password'] || row['smtp_pass'] || '';
    const username = row['username'] || row['smtp_username'] || row['smtp_user'] || email;

    if (hasSmtpHostCol && !providerId) {
      // Mode B: Full override — each row specifies its own SMTP/IMAP
      rows.push({
        org_id: orgId,
        email,
        provider: 'custom_smtp',
        status: 'active',
        smtp_provider_id: null,
        from_name: row['from_name'] || row['display_name'] || row['name'] || email.split('@')[0],
        config: {
          smtpHost: row['smtp_host'] || row['smtp_server'] || '',
          smtpPort: row['smtp_port'] || '465',
          smtpUser: row['smtp_username'] || row['smtp_user'] || username,
          smtpPass: row['smtp_password'] || row['smtp_pass'] || password,
          imapHost: row['imap_host'] || row['imap_server'] || '',
          imapPort: row['imap_port'] || '993',
          imapUser: row['imap_username'] || row['imap_user'] || email,
          imapPass: row['imap_password'] || row['imap_pass'] || password,
        },
      });
    } else {
      // Mode A: Credentials only — inherit from provider
      rows.push({
        org_id: orgId,
        email,
        provider: 'custom_smtp',
        status: 'active',
        smtp_provider_id: providerId || null,
        from_name: row['from_name'] || row['display_name'] || row['name'] || email.split('@')[0],
        config: {
          smtpUser: username,
          smtpPass: password,
          imapUser: row['imap_username'] || row['imap_user'] || email,
          imapPass: row['imap_password'] || row['imap_pass'] || password,
        },
      });
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
