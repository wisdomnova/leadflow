// lib/email-oauth/google-oauth.ts
import { google } from 'googleapis';

const isDev = process.env.NODE_ENV === 'development';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET, 
  isDev 
    ? process.env.GOOGLE_REDIRECT_URI 
    : process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI_PROD
);

export function getGoogleAuthUrl(userId: string): string {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/userinfo.email'
  ];
  
  return oauth2Client.generateAuthUrl({ 
    access_type: 'offline',
    scope: scopes,
    state: userId,
    prompt: 'consent' // Force to get refresh token
  });
}

export async function handleGoogleCallback(code: string) {
  const { tokens } = await oauth2Client.getToken(code);
  
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  
  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresAt: new Date(tokens.expiry_date!),
    email: profile.data.emailAddress!
  };
}

export async function refreshGoogleToken(refreshToken: string) {
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });
  
  const { credentials } = await oauth2Client.refreshAccessToken();
  
  return {
    accessToken: credentials.access_token!,
    refreshToken: credentials.refresh_token || refreshToken,
    expiresAt: new Date(credentials.expiry_date!)
  };
}

export async function sendEmailViaGmail(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  from: string
): Promise<{ messageId: string; threadId: string }> {
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    body
  ].join('\n');
  
  const encodedMessage = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
  
  return {
    messageId: result.data.id!,
    threadId: result.data.threadId!
  };
}

export async function fetchGmailMessages(
  accessToken: string,
  maxResults: number = 50
) {
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  
  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: 'in:inbox is:unread'
  });
  
  const messages = response.data.messages || [];
  const detailedMessages = [];
  
  for (const message of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'full'
    });
    
    detailedMessages.push(detail.data);
  }
  
  return detailedMessages;
}