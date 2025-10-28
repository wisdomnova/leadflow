// scripts/generate-encryption-key.ts
import crypto from 'crypto'

const key = crypto.randomBytes(32).toString('base64')
console.log('Add this to .env.local:')
console.log(`ENCRYPTION_KEY=${key}`)