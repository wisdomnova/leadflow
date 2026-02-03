import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth-utils";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export async function POST(req: Request) {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      type, // 'smtp' or 'imap'
      host, 
      port, 
      user, 
      pass, 
      secure = true 
    } = await req.json();

    if (type === 'smtp') {
      const transporter = nodemailer.createTransport({
        host,
        port: parseInt(port),
        secure: secure || port === '465',
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000, // 10 seconds
      });

      try {
        await transporter.verify();
        return NextResponse.json({ success: true, message: "SMTP connection successful" });
      } catch (err: any) {
        return NextResponse.json({ 
          success: false, 
          error: err.message || "SMTP connection failed",
          code: err.code
        }, { status: 400 });
      }
    } 
    
    if (type === 'imap') {
        const client = new ImapFlow({
            host,
            port: parseInt(port),
            secure: secure || port === '993',
            auth: {
                user,
                pass,
            },
            logger: false,
            clientInfo: {
                name: 'LeadFlow CRM',
                version: '1.0.0'
            }
        });

        try {
            await client.connect();
            await client.logout();
            return NextResponse.json({ success: true, message: "IMAP connection successful" });
        } catch (err: any) {
            return NextResponse.json({ 
                success: false, 
                error: err.message || "IMAP connection failed" 
            }, { status: 400 });
        }
    }

    return NextResponse.json({ error: "Invalid connection type" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
