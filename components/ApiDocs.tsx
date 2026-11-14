/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Swagger UI for the public API (#25). Uses swagger-ui-dist, the
 * framework-free build, and loads it only on this page.
 */

'use client';

import { useEffect, useRef } from 'react';
import 'swagger-ui-dist/swagger-ui.css';

/** Renders the OpenAPI document at `specUrl` with Swagger UI. */
export default function ApiDocs({ specUrl }: { specUrl: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Loaded on demand: the bundle is about 1 MB and only this page needs it.
    void import('swagger-ui-dist/swagger-ui-bundle.js').then(({ default: SwaggerUIBundle }) => {
      if (cancelled || !container.current) return;
      // A key entered under "Authorize" lives only in this tab's memory.
      SwaggerUIBundle({ url: specUrl, domNode: container.current, deepLinking: true, persistAuthorization: false });
    });
    return () => {
      cancelled = true;
    };
  }, [specUrl]);

  // Swagger UI's stylesheet assumes a light background, so it sits on a white card.
  return <div ref={container} className="rounded-xl bg-white p-2" />;
}
