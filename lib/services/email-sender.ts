import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  fromName?: string;
  account: any; // The email_account record from DB
}

/**
 * Refresh a Google OAuth2 access token using the refresh_token grant.
 * Returns the new access_token string.
 */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment variables.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Google token refresh failed:", JSON.stringify(data));
    throw new Error(`Google token refresh failed: ${data.error_description || data.error || "Unknown error"}`);
  }

  return { access_token: data.access_token, expires_in: data.expires_in };
}

/**
 * Send an email via the Gmail API (REST) using an access_token.
 * This avoids all SMTP/nodemailer auth issues with Google.
 */
async function sendViaGmailApi({ to, subject, bodyHtml, bodyText, fromEmail, fromName, accessToken }: {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  fromEmail: string;
  fromName?: string;
  accessToken: string;
}): Promise<{ success: boolean; messageId: string }> {
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const boundary = "leadflow_boundary_" + Date.now();

  // Build RFC 2822 MIME message
  const rawMessage = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    bodyText,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    bodyHtml,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  // Base64url encode the message
  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Gmail API send failed:", JSON.stringify(data));
    throw new Error(`Gmail API error: ${data.error?.message || JSON.stringify(data.error) || "Unknown error"}`);
  }

  return { success: true, messageId: data.id };
}

export async function sendOutreachEmail({ to, subject, bodyHtml, fromName, account }: SendEmailParams) {
  // Generate simple plain text version for better deliverability
  const bodyText = bodyHtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '') 
    .replace(/&nbsp;/g, ' ');

  if (account.provider === 'aws_ses') {
    // Use the SES configuration from account.config or env if it's the master account
    const sesClient = new SESv2Client({
      region: account.config?.region || process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: account.config?.accessKeyId || process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: account.config?.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const fromEmail = account.email;
    const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const command = new SendEmailCommand({
      FromEmailAddress: source,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { 
            Html: { Data: bodyHtml, Charset: "UTF-8" },
            Text: { Data: bodyText, Charset: "UTF-8" }
          },
        },
      },
    });

    const response = await sesClient.send(command);
    return { success: true, messageId: response.MessageId };
  } else if (account.provider === 'google') {
    // ========== GMAIL API (REST) — bypasses all SMTP auth issues ==========
    const config = account.config || {};
    
    if (!config.refresh_token) {
      throw new Error(`No refresh_token found for Google account: ${account.email}. Please reconnect the account.`);
    }

    // Always get a fresh access_token from the refresh_token
    console.log(`[Gmail API] Refreshing token for ${account.email}...`);
    const { access_token: freshToken } = await refreshGoogleAccessToken(config.refresh_token);
    console.log(`[Gmail API] Token refreshed. Sending to ${to}...`);

    const result = await sendViaGmailApi({
      to,
      subject,
      bodyHtml,
      bodyText,
      fromEmail: account.email,
      fromName,
      accessToken: freshToken,
    });

    return { success: true, messageId: result.messageId };

  } else if (account.provider === 'custom_smtp' || account.provider === 'outlook') {
    // ========== SMTP-based sending for Custom SMTP & Outlook ==========
    const config = account.config || {};
    let smtpHost = config.smtpHost;
    let smtpPort = parseInt(config.smtpPort || '587');
    let smtpUser = config.smtpUser || account.email;
    let smtpPass = config.smtpPass || config.pass;

    if (!smtpHost && account.provider === 'outlook') {
      smtpHost = 'smtp.office365.com';
      smtpPort = 587;
    }

    if (!smtpHost) {
      throw new Error(`SMTP host not configured for provider: ${account.provider}`);
    }

    // Configure Auth
    const auth: any = { user: smtpUser };
    
    // OAuth2 for Outlook
    const hasOAuth = !!(config.access_token || config.refresh_token) && account.provider === 'outlook';

    if (hasOAuth) {
      auth.type = 'OAuth2';
      auth.user = account.email;
      auth.clientId = process.env.AZURE_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
      auth.clientSecret = process.env.AZURE_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET;
      auth.refreshToken = config.refresh_token;
      auth.accessToken = config.access_token;
    } else if (smtpPass) {
      auth.pass = smtpPass;
    } else {
      throw new Error(`No credentials found for account: ${account.email}`);
    }

    const transportConfig: any = {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    };

    const transporter = nodemailer.createTransport(transportConfig);

    const fromEmail = account.email;
    const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const info = await transporter.sendMail({
      from: source,
      to: to,
      subject: subject,
      text: bodyText,
      html: bodyHtml,
    });

    return { success: true, messageId: info.messageId };
  }

  throw new Error(`Unsupported provider: ${account.provider}`);
}
