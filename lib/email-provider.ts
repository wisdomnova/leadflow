import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const JWT_SECRET = process.env.JWT_SECRET!

interface TokenPayload {
  userId: string
  email: string
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function getUserEmailProvider(userId: string) {
  try {
    const { data, error } = await supabase
      .from('email_providers')
      .select('id, provider_type, is_verified')
      .eq('user_id', userId)
      .single()

    if (error) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function isEmailProviderConfigured(userId: string): Promise<boolean> {
  const provider = await getUserEmailProvider(userId)
  
  if (!provider) {
    return false
  }

  // Check if it's not 'skip' type or if it's verified
  return provider.provider_type !== 'skip' || provider.is_verified
}

export async function requireEmailProvider(userId: string): Promise<{ isConfigured: boolean; provider?: any }> {
  const provider = await getUserEmailProvider(userId)
  
  if (!provider) {
    return { isConfigured: false }
  }

  if (provider.provider_type === 'skip') {
    return { isConfigured: false, provider }
  }

  return { isConfigured: true, provider }
}
