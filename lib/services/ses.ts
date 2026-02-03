import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  fromName?: string;
}

/**
 * Sends an email using AWS SES Portfolio API
 */
export async function sendOutreachEmail({ to, subject, bodyHtml, fromName }: SendEmailParams) {
  const fromEmail = process.env.AWS_SES_FROM_EMAIL!;
  const source = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

  const command = new SendEmailCommand({
    FromEmailAddress: source,
    Destination: {
      ToAddresses: [to],
    },
    Content: {
      Simple: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: bodyHtml,
            Charset: "UTF-8",
          },
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error("SES send error:", error);
    return { success: false, error };
  }
}
