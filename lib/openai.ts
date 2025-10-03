// lib/openai.ts
import OpenAI from 'openai'

// Check if API key exists and is valid format
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  console.warn('⚠️  OPENAI_API_KEY is not set in environment variables')
} else if (!apiKey.startsWith('sk-')) {
  console.warn('⚠️  OPENAI_API_KEY appears to be invalid (should start with "sk-")')
}

// Create OpenAI client only if we have a valid-looking key
export const openai = apiKey && apiKey.startsWith('sk-') 
  ? new OpenAI({ apiKey }) 
  : null

export const isOpenAIConfigured = !!openai

// Helper function to check if OpenAI is ready
export function checkOpenAIAvailable(): boolean {
  if (!openai) {
    console.error('❌ OpenAI is not configured. Please set OPENAI_API_KEY in your environment variables.')
    return false
  }
  return true
}

// Safe wrapper for OpenAI calls
export async function safeOpenAICall<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  if (!checkOpenAIAvailable()) {
    return fallback || null
  }
  
  try {
    return await operation()
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return fallback || null
  }
}