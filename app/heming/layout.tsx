/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 12, 2026 · San Francisco, California, USA
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

// The page itself is a client component, so its title and description come from this
// layout; without it the tab and search result read the same as the home page (#63).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('heming.meta');
  return { title: t('title'), description: t('description') };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
