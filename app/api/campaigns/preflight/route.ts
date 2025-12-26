import { NextResponse } from 'next/server';
import { runPreflight } from '@/lib/preflight';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { subject = '', body = '', fromEmail = '', replyTo = '' } = payload || {};

    const report = runPreflight({ subject, body, fromEmail, replyTo });
    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    return NextResponse.json({
      status: 'fail',
      issues: [{ type: 'error', code: 'PRE', message: 'Invalid request payload.' }],
    }, { status: 400 });
  }
}
