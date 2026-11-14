import { z } from 'zod';

/** Body of POST /api/keys. The key service checks the name's length after trimming. */
export const createApiKeyBodySchema = z
  .object({ name: z.string({ error: 'must be text' }) }, { error: 'Request body must be a JSON object' })
  .strict();
