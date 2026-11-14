import { describe, it, expect } from 'vitest';
import { messageBodySchema, shareBodySchema } from '@/lib/validation/consultation-request';

// Request bodies for the consultation routes (#21). The routes check the shape here; the
// service still validates the email and the message text itself.

describe('shareBodySchema — POST /api/charts/:id/shares', () => {
  it('accepts { email } as a string', () => {
    expect(shareBodySchema.parse({ email: 'prac@example.test' })).toEqual({ email: 'prac@example.test' });
  });

  it.each([[{}], [{ email: 42 }], [{ email: 'a'.repeat(321) }], [null], ['prac@example.test']])('rejects %j', (body) => {
    expect(shareBodySchema.safeParse(body).success).toBe(false);
  });
});

describe('messageBodySchema — POST /api/shares/:id/messages', () => {
  it('accepts { body } as a string', () => {
    expect(messageBodySchema.parse({ body: 'Hello' })).toEqual({ body: 'Hello' });
  });

  it.each([[{}], [{ body: 1 }], [{ text: 'Hello' }], [null]])('rejects %j', (body) => {
    expect(messageBodySchema.safeParse(body).success).toBe(false);
  });
});
