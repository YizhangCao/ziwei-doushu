import { z } from 'zod';

// Request bodies for the consultation routes (#21). These check the shape only; the service
// trims and validates the email and the message text, so the rules live in one place.

/** POST /api/charts/:id/shares. 320 is the longest valid email address. */
export const shareBodySchema = z.object({
  email: z.string({ error: 'must be a string' }).max(320, 'must be at most 320 characters'),
});

/** POST /api/shares/:id/messages. The service enforces 1–2,000 characters after trimming. */
export const messageBodySchema = z.object({
  body: z.string({ error: 'must be a string' }),
});
