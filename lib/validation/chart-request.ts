import { z } from 'zod';

// Request bodies for /api/charts. The chart service validates the name and the birth data
// in detail (lib/charts/service.ts, lib/validation/birth-info.ts); these only check the shape.

export const createChartBodySchema = z.object(
  {
    name: z.string({ error: 'must be text' }),
    birthInfo: z.record(z.string(), z.unknown(), { error: 'must be an object' }),
  },
  { error: 'Request body must be a JSON object' },
);

export const renameChartBodySchema = z
  .object({ name: z.string({ error: 'must be text' }) }, { error: 'Request body must be a JSON object' })
  .strict();
