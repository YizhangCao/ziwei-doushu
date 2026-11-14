/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview The UI message catalogs (#59), one JSON file per namespace and locale.
 * Chinese is the source of truth: zh holds today's strings verbatim, and en must have
 * the same keys and ICU arguments (tests/unit/i18n/messages.test.ts). Server-only: the
 * request config hands the active locale's messages to NextIntlClientProvider.
 */

import zhAbout from './zh/about.json';
import zhAdmin from './zh/admin.json';
import zhApiDocs from './zh/apiDocs.json';
import zhAuth from './zh/auth.json';
import zhBirthForm from './zh/birthForm.json';
import zhBoard from './zh/board.json';
import zhChart from './zh/chart.json';
import zhCharts from './zh/charts.json';
import zhConsultations from './zh/consultations.json';
import zhForbidden from './zh/forbidden.json';
import zhHeming from './zh/heming.json';
import zhHome from './zh/home.json';
import zhInsight from './zh/insight.json';
import zhKnowledge from './zh/knowledge.json';
import zhLegal from './zh/legal.json';
import zhLibrary from './zh/library.json';
import zhMeta from './zh/meta.json';
import zhNav from './zh/nav.json';
import zhNotFound from './zh/notFound.json';
import zhTimeNav from './zh/timeNav.json';
import enAbout from './en/about.json';
import enAdmin from './en/admin.json';
import enApiDocs from './en/apiDocs.json';
import enAuth from './en/auth.json';
import enBirthForm from './en/birthForm.json';
import enBoard from './en/board.json';
import enChart from './en/chart.json';
import enCharts from './en/charts.json';
import enConsultations from './en/consultations.json';
import enForbidden from './en/forbidden.json';
import enHeming from './en/heming.json';
import enHome from './en/home.json';
import enInsight from './en/insight.json';
import enKnowledge from './en/knowledge.json';
import enLegal from './en/legal.json';
import enLibrary from './en/library.json';
import enMeta from './en/meta.json';
import enNav from './en/nav.json';
import enNotFound from './en/notFound.json';
import enTimeNav from './en/timeNav.json';
import type { Locale } from '@/lib/i18n/locale';

const zh = {
  about: zhAbout,
  admin: zhAdmin,
  apiDocs: zhApiDocs,
  auth: zhAuth,
  birthForm: zhBirthForm,
  board: zhBoard,
  chart: zhChart,
  charts: zhCharts,
  consultations: zhConsultations,
  forbidden: zhForbidden,
  heming: zhHeming,
  home: zhHome,
  insight: zhInsight,
  knowledge: zhKnowledge,
  legal: zhLegal,
  library: zhLibrary,
  meta: zhMeta,
  nav: zhNav,
  notFound: zhNotFound,
  timeNav: zhTimeNav,
};

export type Messages = typeof zh;

const en: Messages = {
  about: enAbout,
  admin: enAdmin,
  apiDocs: enApiDocs,
  auth: enAuth,
  birthForm: enBirthForm,
  board: enBoard,
  chart: enChart,
  charts: enCharts,
  consultations: enConsultations,
  forbidden: enForbidden,
  heming: enHeming,
  home: enHome,
  insight: enInsight,
  knowledge: enKnowledge,
  legal: enLegal,
  library: enLibrary,
  meta: enMeta,
  nav: enNav,
  notFound: enNotFound,
  timeNav: enTimeNav,
};

export const MESSAGES: Record<Locale, Messages> = { zh, en };
