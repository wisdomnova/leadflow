import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(secret: string) {
  const hash = crypto.createHash('sha256').update(secret).digest()
  return hash // 32 bytes
}

export function encrypt(text: string, secret: string) {
  const key = getKey(secret)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: enc.toString('base64'),
  }
}

export function decrypt(payload: { iv: string; tag: string; data: string }, secret: string) {
  const key = getKey(secret)
  const iv = Buffer.from(payload.iv, 'base64')
  const tag = Buffer.from(payload.tag, 'base64')
  const data = Buffer.from(payload.data, 'base64')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}
