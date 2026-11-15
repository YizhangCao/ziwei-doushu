import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Rendered once at build time and served as a static file, so the deployment never
// reads docs/ at runtime.
export const dynamic = 'force-static';

/** Serves docs/openapi.yaml, which Swagger UI on /api-docs loads. */
export async function GET() {
  const spec = await readFile(join(process.cwd(), 'docs/openapi.yaml'), 'utf8');
  return new Response(spec, { headers: { 'Content-Type': 'application/yaml; charset=utf-8' } });
}
