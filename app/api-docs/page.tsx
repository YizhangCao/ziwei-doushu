/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/** @fileoverview Public API documentation page (#25), open to guests. */

import type { Metadata } from 'next';
import ApiDocs from '@/components/ApiDocs';

export const metadata: Metadata = {
  title: 'API 文档 · 紫微命盘',
  description: 'ZiweiHub 公开 API：用出生信息生成紫微斗数命盘 JSON。',
};

/** Introduces the API in Chinese, then renders the OpenAPI document with Swagger UI. */
export default function ApiDocsPage() {
  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="card-glass rounded-xl p-6">
          <h1 className="text-xl font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
            API 文档
          </h1>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--t-text2)' }}>
            用出生日期、时辰和性别生成紫微斗数命盘 JSON。每个请求都需要在 <code>Authorization</code> 头里带上
            <code> Bearer </code>
            API key；key 在登录后的设置页创建，只显示一次。试用时请用虚构的出生信息。
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--t-faint)' }}>
            规范文件：
            <a href="/api-docs/openapi.yaml" className="underline focus:outline-none focus-visible:ring-2" style={{ color: 'var(--t-gold)' }}>
              openapi.yaml
            </a>
            （OpenAPI 3.1）
          </p>
        </header>
        <ApiDocs specUrl="/api-docs/openapi.yaml" />
      </div>
    </main>
  );
}
