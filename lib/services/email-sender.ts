import nodemailer from "nodemailer";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  fromName?: string;
  account: any; // The email_account record from DB
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
  } else if (account.provider === 'custom_smtp' || account.provider === 'google' || account.provider === 'outlook') {
    // For custom SMTP, or OAuth (if we had tokens)
    const transporter = nodemailer.createTransport({
      host: account.config?.smtpHost,
      port: parseInt(account.config?.smtpPort),
      secure: account.config?.smtpPort === '465',
      auth: {
        user: account.config?.smtpUser || account.email,
        pass: account.config?.smtpPass,
      },
    });

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
