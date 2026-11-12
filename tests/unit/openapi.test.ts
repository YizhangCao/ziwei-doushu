/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Keeps docs/openapi.yaml honest: it documents exactly the /api/v1
 * routes that exist, every operation has examples, request examples pass the real
 * validator, and the documented 400 messages are the ones the API returns.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { parsePublicChartRequest } from '@/lib/validation/public-chart-request';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface Example {
  value: unknown;
}
interface Operation {
  security?: Record<string, string[]>[];
  requestBody?: { content: Record<string, { examples?: Record<string, Example> }> };
  responses: Record<string, { content?: Record<string, { examples?: Record<string, Example> }> }>;
}
interface Spec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Partial<Record<(typeof METHODS)[number], Operation>>>;
  components: { securitySchemes: Record<string, { type: string; scheme?: string }> };
}

const spec = parse(readFileSync(join(ROOT, 'docs/openapi.yaml'), 'utf8')) as Spec;

/** Every route under app/api/v1 as "METHOD /path", read from the route files. */
function v1Operations(dir = join(ROOT, 'app/api/v1'), path = '/api/v1'): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const segment = entry.name.replace(/^\[(.+)\]$/, '{$1}');
      found.push(...v1Operations(join(dir, entry.name), `${path}/${segment}`));
    } else if (entry.name === 'route.ts') {
      const source = readFileSync(join(dir, entry.name), 'utf8');
      for (const [, method] of source.matchAll(/export (?:async function|const) (GET|POST|PUT|PATCH|DELETE)\b/g)) {
        found.push(`${method} ${path}`);
      }
    }
  }
  return found.sort();
}

function documentedOperations(): string[] {
  return Object.entries(spec.paths)
    .flatMap(([path, item]) => METHODS.filter((m) => item[m]).map((m) => `${m.toUpperCase()} ${path}`))
    .sort();
}

const chartsPost = () => spec.paths['/api/v1/charts']!.post!;
const examplesOf = (content?: Record<string, { examples?: Record<string, Example> }>) =>
  content?.['application/json']?.examples ?? {};

describe('docs/openapi.yaml', () => {
  it('is an OpenAPI 3.1 document with a title and version', () => {
    expect(spec.openapi).toMatch(/^3\.1\./);
    expect(spec.info.title).toBeTruthy();
    expect(spec.info.version).toBeTruthy();
  });

  it('documents exactly the /api/v1 routes that exist', () => {
    expect(v1Operations().length).toBeGreaterThan(0);
    expect(documentedOperations()).toEqual(v1Operations());
  });

  it('requires a bearer API key on every operation', () => {
    const schemes = spec.components.securitySchemes;
    for (const item of Object.values(spec.paths)) {
      for (const method of METHODS) {
        const op = item[method];
        if (!op) continue;
        const [name] = Object.keys(op.security?.[0] ?? {});
        expect(schemes[name]).toEqual(expect.objectContaining({ type: 'http', scheme: 'bearer' }));
      }
    }
  });

  it('gives every response of every operation at least one example', () => {
    for (const item of Object.values(spec.paths)) {
      for (const method of METHODS) {
        const op = item[method];
        if (!op) continue;
        if (op.requestBody) expect(Object.keys(examplesOf(op.requestBody.content)).length).toBeGreaterThan(0);
        for (const [status, response] of Object.entries(op.responses)) {
          expect(Object.keys(examplesOf(response.content)).length, `${method} response ${status}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has request examples that POST /api/v1/charts accepts', () => {
    for (const [name, example] of Object.entries(examplesOf(chartsPost().requestBody!.content))) {
      expect(parsePublicChartRequest(example.value).ok, name).toBe(true);
    }
  });

  it('documents the 400 messages the API actually returns', () => {
    // The body that produces each documented 400 example.
    const bodies: Record<string, unknown> = {
      invalidHour: { date: '1990-06-15', hour: 12, gender: 'female' },
      invalidDate: { date: '1990-02-30', hour: 6, gender: 'female' },
      invalidGender: { date: '1990-06-15', hour: 6, gender: 'other' },
      unknownField: { date: '1990-06-15', hour: 6, gender: 'female', name: 'A Person' },
    };
    const documented = examplesOf(chartsPost().responses['400'].content);

    expect(Object.keys(documented)).toEqual(expect.arrayContaining(Object.keys(bodies)));
    for (const [name, body] of Object.entries(bodies)) {
      const result = parsePublicChartRequest(body);
      expect(result.ok, name).toBe(false);
      expect(documented[name].value, name).toEqual({ error: result.ok ? null : result.error });
    }
  });
});
