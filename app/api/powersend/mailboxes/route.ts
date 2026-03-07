import { NextResponse } from 'next/server';
import { getSessionContext } from "@/lib/auth-utils";
import { checkSubscription } from "@/lib/subscription-check";
import { getAdminClient } from "@/lib/supabase";

/**
 * GET /api/powersend/mailboxes?serverId=xxx
 * Returns all mailboxes for a specific server, or all mailboxes for the org.
 */
export async function GET(req: Request) {
  const context = await getSessionContext();
  if (!context) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { orgId } = context;
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');

    const adminClient = getAdminClient();

    let query = adminClient
      .from('server_mailboxes')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (serverId) {
      query = query.eq('server_id', serverId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Summary stats
    const mailboxes = data || [];
    const stats = {
      total: mailboxes.length,
      active: mailboxes.filter((m: any) => m.status === 'active').length,
      warming: mailboxes.filter((m: any) => m.status === 'warming').length,
      paused: mailboxes.filter((m: any) => m.status === 'paused').length,
      errors: mailboxes.filter((m: any) => m.status === 'error').length,
      totalSends: mailboxes.reduce((sum: number, m: any) => sum + (m.total_sends || 0), 0),
    };

    return NextResponse.json({ mailboxes, stats });
  } catch (error: any) {
    console.error('Error fetching mailboxes:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * POST /api/powersend/mailboxes
 * Add a single mailbox or bulk import from CSV.
 * Body: { serverId, mailbox: {...} } — single
 * Body: { serverId, mailboxes: [...] } — bulk
 * Body: { serverId, csv: "email,password,smtp_host..." } — CSV string
 */
export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { supabase, orgId } = context;
    const sub = await checkSubscription(orgId);

    if (sub.tier !== 'enterprise') {
      return new NextResponse('PowerSend is Enterprise-only', { status: 403 });
    }

    const body = await req.json();
    const { serverId } = body;

    if (!serverId) {
      return new NextResponse('Missing serverId', { status: 400 });
    }

    const adminClient = getAdminClient();

    // Verify server ownership using admin client to avoid RLS issues
    const { data: server, error: serverError } = await adminClient
      .from('smart_servers')
      .select('id, org_id, default_smtp_host, default_smtp_port, default_imap_host, default_imap_port')
      .eq('id', serverId)
      .eq('org_id', orgId)
      .single();

    if (serverError || !server) {
      console.error('Server lookup failed:', serverError);
      return new NextResponse('Server not found or access denied', { status: 404 });
    }
    let mailboxRows: any[] = [];

    if (body.csv) {
      // CSV import
      mailboxRows = parseCSV(body.csv, serverId, orgId, server as any);
    } else if (body.mailboxes && Array.isArray(body.mailboxes)) {
      // Bulk array import
      mailboxRows = body.mailboxes.map((m: any) => ({
        server_id: serverId,
        org_id: orgId,
        email: m.email,
        display_name: m.display_name || m.email.split('@')[0],
        smtp_host: m.smtp_host || null,
        smtp_port: m.smtp_port || null,
        smtp_username: m.smtp_username || null,
        smtp_password: m.smtp_password || null,
        imap_host: m.imap_host || null,
        imap_port: m.imap_port || null,
        imap_username: m.imap_username || null,
        imap_password: m.imap_password || null,
        daily_limit: m.daily_limit || 30,
        status: 'active',
      }));
    } else if (body.mailbox) {
      // Single mailbox
      const m = body.mailbox;
      mailboxRows = [{
        server_id: serverId,
        org_id: orgId,
        email: m.email,
        display_name: m.display_name || m.email.split('@')[0],
        smtp_host: m.smtp_host || null,
        smtp_port: m.smtp_port || null,
        smtp_username: m.smtp_username || null,
        smtp_password: m.smtp_password || null,
        imap_host: m.imap_host || null,
        imap_port: m.imap_port || null,
        imap_username: m.imap_username || null,
        imap_password: m.imap_password || null,
        daily_limit: m.daily_limit || 30,
        status: 'active',
      }];
    } else {
      return new NextResponse('Missing mailbox data', { status: 400 });
    }

    if (mailboxRows.length === 0) {
      return new NextResponse('No valid mailboxes found', { status: 400 });
    }

    // Upsert to handle duplicates gracefully
    const { data: inserted, error: insertError } = await (adminClient as any)
      .from('server_mailboxes')
      .upsert(mailboxRows, { onConflict: 'server_id,email', ignoreDuplicates: true })
      .select();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      imported: (inserted || []).length,
      total: mailboxRows.length,
      message: `${(inserted || []).length} mailbox${(inserted || []).length !== 1 ? 'es' : ''} imported`,
    });
  } catch (error: any) {
    console.error('Error adding mailboxes:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * PATCH /api/powersend/mailboxes
 * Update a mailbox. Body: { mailboxId, ...fields }
 */
export async function PATCH(req: Request) {
  const context = await getSessionContext();
  if (!context) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { orgId } = context;
    const body = await req.json();
    const { mailboxId, ...updates } = body;

    if (!mailboxId) return new NextResponse('Missing mailboxId', { status: 400 });

    const adminClient = getAdminClient();
    const { data, error } = await (adminClient as any)
      .from('server_mailboxes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', mailboxId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating mailbox:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

/**
 * DELETE /api/powersend/mailboxes
 * Delete mailbox(es). Body: { mailboxIds: string[] }
 */
export async function DELETE(req: Request) {
  const context = await getSessionContext();
  if (!context) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { orgId } = context;
    const body = await req.json();
    const { mailboxIds } = body;

    if (!mailboxIds || !Array.isArray(mailboxIds) || mailboxIds.length === 0) {
      return new NextResponse('Missing mailboxIds', { status: 400 });
    }

    const adminClient = getAdminClient();

    const { error } = await adminClient
      .from('server_mailboxes')
      .delete()
      .in('id', mailboxIds)
      .eq('org_id', orgId);

    if (error) throw error;
    return NextResponse.json({ success: true, deleted: mailboxIds.length });
  } catch (error: any) {
    console.error('Error deleting mailboxes:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}


// ---- CSV Parser ----
function parseCSV(csvString: string, serverId: string, orgId: string, server: any): any[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return []; // Need header + at least 1 row

  // Parse headers properly (handle quoted CSV)
  const headerValues = parseCSVLine(lines[0]);
  const headers = headerValues.map(h => h.trim().toLowerCase().replace(/[\s\-]+/g, '_'));
  const rows: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted CSV values
    const values = parseCSVLine(line);
    if (values.length < 1) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });

    // email is required
    const email = row['email'] || row['email_address'] || row['mail'] || '';
    if (!email || !email.includes('@')) continue;

    rows.push({
      server_id: serverId,
      org_id: orgId,
      email,
      display_name: row['display_name'] || row['name'] || row['from_name'] || email.split('@')[0],
      smtp_host: row['smtp_host'] || row['smtp_server'] || null,
      smtp_port: row['smtp_port'] ? parseInt(row['smtp_port']) : null,
      smtp_username: row['smtp_username'] || row['smtp_user'] || row['username'] || null,
      smtp_password: row['smtp_password'] || row['smtp_pass'] || row['password'] || row['app_password'] || null,
      imap_host: row['imap_host'] || row['imap_server'] || null,
      imap_port: row['imap_port'] ? parseInt(row['imap_port']) : null,
      imap_username: row['imap_username'] || row['imap_user'] || null,
      imap_password: row['imap_password'] || row['imap_pass'] || null,
      daily_limit: row['daily_limit'] ? parseInt(row['daily_limit']) : 30,
      status: 'active',
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
