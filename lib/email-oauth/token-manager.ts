// lib/email-oauth/token-manager.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16  // 128 bits
const TAG_LENGTH = 16 // 128 bits

// Get encryption key from environment variable
function getEncryptionKey(): Buffer {
  const key = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!key) {
    throw new Error('INTEGRATION_ENCRYPTION_KEY environment variable is required')
  }
  
  // If key is hex string, convert it to buffer
  if (key.length === 64) {
    return Buffer.from(key, 'hex')
  }
  
  // Otherwise, hash it to get consistent 32-byte key
  return crypto.createHash('sha256').update(key).digest()
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipher(ALGORITHM, key)
  cipher.setAAD(Buffer.from('leadflow-auth'))
  
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Combine iv, authTag, and encrypted data
  const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')])
  return combined.toString('base64')
}

export function decryptToken(encryptedToken: string): string {
  const key = getEncryptionKey()
  const combined = Buffer.from(encryptedToken, 'base64')
  
  // Extract components
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH)
  
  const decipher = crypto.createDecipher(ALGORITHM, key)
  decipher.setAuthTag(authTag)
  decipher.setAuthTag(authTag)
  decipher.setAAD(Buffer.from('leadflow-auth'))
  
  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: Date
}> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refresh Google token: ${error}`)
  }

  const data = await response.json()
  
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000)
  }
}

export async function getValidAccessToken(emailAccount: any): Promise<string> {
  const now = new Date()
  const expiresAt = new Date(emailAccount.token_expires_at)
  
  // If token expires within the next 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log(`🔄 Refreshing token for ${emailAccount.email}`)
    
    const decryptedRefreshToken = decryptToken(emailAccount.refresh_token)
    const { accessToken, expiresAt: newExpiresAt } = await refreshGoogleToken(decryptedRefreshToken)
    
    // Update the database with new token
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const encryptedNewToken = encryptToken(accessToken)
    
    await supabase
      .from('email_accounts')
      .update({
        access_token: encryptedNewToken,
        token_expires_at: newExpiresAt.toISOString(),
        last_error: null
      })
      .eq('id', emailAccount.id)
    
    return accessToken
  }
  
  // Token is still valid
  return decryptToken(emailAccount.access_token)
}