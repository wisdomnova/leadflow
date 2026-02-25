import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import { getAdminClient } from "@/lib/supabase";

/**
 * POST /api/accounts/bulk
 * Bulk import SMTP email accounts from CSV text.
 * Body: { csv: string } or { accounts: Array<{email, smtpHost, ...}> }
 */
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const adminSupabase = getAdminClient();

    let accountRows: any[] = [];

    if (body.csv) {
      accountRows = parseCSV(body.csv, context.orgId);
    } else if (body.accounts && Array.isArray(body.accounts)) {
      accountRows = body.accounts.map((a: any) => ({
        org_id: context.orgId,
        email: a.email,
        provider: 'custom_smtp',
        status: 'active',
        config: {
          smtpHost: a.smtpHost || a.smtp_host || '',
          smtpPort: a.smtpPort || a.smtp_port || '465',
          smtpUser: a.smtpUser || a.smtp_username || a.email,
          smtpPass: a.smtpPass || a.smtp_password || '',
          imapHost: a.imapHost || a.imap_host || '',
          imapPort: a.imapPort || a.imap_port || '993',
          imapUser: a.imapUser || a.imap_username || a.email,
          imapPass: a.imapPass || a.imap_password || '',
        },
        from_name: a.from_name || a.display_name || a.email.split('@')[0],
      }));
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
function parseCSV(csvString: string, orgId: string): any[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s\-]+/g, '_'));
  const rows: any[] = [];

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

    rows.push({
      org_id: orgId,
      email,
      provider: 'custom_smtp',
      status: 'active',
      from_name: row['from_name'] || row['display_name'] || row['name'] || email.split('@')[0],
      config: {
        smtpHost: row['smtp_host'] || row['smtp_server'] || '',
        smtpPort: row['smtp_port'] || '465',
        smtpUser: row['smtp_username'] || row['smtp_user'] || row['username'] || email,
        smtpPass: row['smtp_password'] || row['smtp_pass'] || row['password'] || row['app_password'] || '',
        imapHost: row['imap_host'] || row['imap_server'] || '',
        imapPort: row['imap_port'] || '993',
        imapUser: row['imap_username'] || row['imap_user'] || email,
        imapPass: row['imap_password'] || row['imap_pass'] || '',
      },
    });
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
