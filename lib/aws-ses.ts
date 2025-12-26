import { SESv2Client, CreateEmailIdentityCommand } from '@aws-sdk/client-sesv2'

export type SesCredentials = {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export function getSesClient(creds: SesCredentials) {
  return new SESv2Client({
    region: creds.region,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey,
    },
  })
}

export async function createIdentityAndGetDkimTokens(client: SESv2Client, domain: string): Promise<string[]> {
  const cmd = new CreateEmailIdentityCommand({
    EmailIdentity: domain,
    DkimSigningAttributes: {
      DomainSigningPrivateKey: undefined,
      DomainSigningSelector: undefined,
      NextSigningKeyLength: 'RSA_2048_BIT',
    },
  })
  const res = await client.send(cmd)
  const tokens = res.DkimAttributes?.Tokens || []
  return tokens as string[]
}
