/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Types for the part of swagger-ui-dist that components/ApiDocs.tsx uses; the package ships none. */

declare module 'swagger-ui-dist/swagger-ui-bundle.js' {
  interface SwaggerUIOptions {
    /** URL of the OpenAPI document to render. */
    url: string;
    /** Element to render into. */
    domNode: HTMLElement;
    deepLinking?: boolean;
    persistAuthorization?: boolean;
  }

  const SwaggerUIBundle: (options: SwaggerUIOptions) => unknown;
  export default SwaggerUIBundle;
}
