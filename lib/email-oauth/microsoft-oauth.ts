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
  const clientId = process.env.MICROSOFT_CLIENT_ID!
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI!
  
  const scopes = [
    'https://graph.microsoft.com/Mail.Send',
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/User.Read'
  ]

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state: userId,
    prompt: 'consent'
  })

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
}

export async function handleMicrosoftCallback(code: string) {
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens')
  }

  const tokens = await response.json()
  
  // Get user info
  const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  })

  if (!userResponse.ok) {
    throw new Error('Failed to get user info')
  }

  const userInfo = await userResponse.json()

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    email: userInfo.mail || userInfo.userPrincipalName
  }
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
  
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }

  // Microsoft Graph doesn't return message ID in response for sendMail
  // We'll generate a unique ID for tracking
  return {
    messageId: `outlook_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
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