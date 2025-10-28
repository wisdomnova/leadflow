// lib/email-oauth/microsoft-oauth.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

const isDev = process.env.NODE_ENV === 'development';

const tenantId = 'common'; // Use 'common' for multi-tenant
const clientId = process.env.MICROSOFT_CLIENT_ID!;
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
const redirectUri = isDev
  ? process.env.MICROSOFT_REDIRECT_URI!
  : process.env.NEXT_PUBLIC_MICROSOFT_REDIRECT_URI_PROD!;

export function getMicrosoftAuthUrl(userId: string): string {
  const scopes = [
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read',
    'offline_access'
  ];
  
  const authUrl = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('scope', scopes.join(' '));
  authUrl.searchParams.append('state', userId);
  authUrl.searchParams.append('response_mode', 'query');
  
  return authUrl.toString();
}

export async function handleMicrosoftCallback(code: string) {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code'
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to get tokens');
  }
  
  // Get user email
  const client = Client.init({
    authProvider: (done) => {
      done(null, data.access_token);
    }
  });
  
  const user = await client.api('/me').get();
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    email: user.mail || user.userPrincipalName
  };
}

export async function refreshMicrosoftToken(refreshToken: string) {
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error_description || 'Failed to refresh token');
  }
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: new Date(Date.now() + data.expires_in * 1000)
  };
}

export async function sendEmailViaOutlook(
  accessToken: string,
  to: string,
  subject: string,
  body: string,
  from: string
): Promise<{
  [x: string]: any; messageId: string 
}> {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
  
  const message = {
    subject,
    body: {
      contentType: 'HTML',
      content: body
    },
    toRecipients: [
      {
        emailAddress: {
          address: to
        }
      }
    ]
  };
  
  const result = await client.api('/me/sendMail').post({
    message,
    saveToSentItems: true
  });
  
  return {
    messageId: result.id || 'sent'
  }; 
}

export async function fetchOutlookMessages(
  accessToken: string,
  maxResults: number = 50
) {
  const client = Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
  
  const response = await client
    .api('/me/messages')
    .top(maxResults)
    .filter('isRead eq false')
    .get();
  
  return response.value;
}