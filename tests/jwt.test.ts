import { describe, it, expect } from 'vitest';
import { signUserJWT, verifyUserJWT, UserPayload } from '@/lib/jwt';

describe('JWT Utility', () => {
  it('should sign and verify a user JWT', async () => {
    const payload: UserPayload = { 
      userId: 'user-123', 
      email: 'test@example.com', 
      orgId: 'org-456', 
      role: 'admin' 
    };
    const token = await signUserJWT(payload);
    expect(token).toBeDefined();

    const verifiedPayload = await verifyUserJWT(token);
    expect(verifiedPayload).toMatchObject(payload);
  });

  it('should return null for invalid token', async () => {
    const payload = await verifyUserJWT('invalid-token');
    expect(payload).toBeNull();
  });
});
