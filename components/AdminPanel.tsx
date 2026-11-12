/**
 * Author: Yikang (Richard) Liu, M.S. Candidate in Computer Science, Khoury College of Computer Sciences, Northeastern University
 * Version: 1.0
 * Created: November 11, 2026 · San Francisco, California, USA
 */

/**
 * @fileoverview Admin area UI (#23): search users and change their role, and set
 * the daily AI limit. Talks to /api/admin/*, which checks the admin role again.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

type Role = 'member' | 'practitioner' | 'admin';

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  githubId: string | null;
  role: Role;
  createdAt: string;
}

const ROLES: Role[] = ['member', 'practitioner', 'admin'];
const BUTTON = 'rounded-full px-4 py-1.5 text-sm focus:outline-none focus-visible:ring-2 disabled:opacity-50';
const FIELD = 'rounded-lg bg-transparent px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2';
const FIELD_STYLE = { border: '1px solid var(--t-border)', color: 'var(--t-text)' };
const BUTTON_STYLE = { border: '1px solid var(--t-border)', color: 'var(--t-gold)' };

const displayName = (user: UserRow) => user.name ?? user.email ?? user.githubId ?? user.id;

/** The `{ error }` message of a failed response, or null to fall back to its status. */
async function errorBody(res: Response): Promise<string | null> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
      return (body as { error: string }).error;
    }
  } catch {
    // Not JSON: fall through to the status.
  }
  return null;
}

/**
 * Renders the two admin sections. Each has its own live status line, so screen
 * readers announce the result of a search or a save.
 */
export default function AdminPanel({ initialDailyAiLimit, currentUserId }: { initialDailyAiLimit: number; currentUserId: string }) {
  const t = useTranslations('admin');
  const roleLabel = (role: Role) => t(`roles.${role}`);
  const errorText = async (res: Response) => (await errorBody(res)) ?? t('requestFailed', { status: res.status });
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, Role>>({});
  const [userStatus, setUserStatus] = useState('');
  const [limit, setLimit] = useState(String(initialDailyAiLimit));
  const [limitStatus, setLimitStatus] = useState('');
  // Numbers each search, so a slow earlier response cannot overwrite a newer one.
  const searchSeq = useRef(0);

  async function search(q: string) {
    const seq = ++searchSeq.current;
    setUserStatus(t('users.searching'));
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    if (seq !== searchSeq.current) return;
    if (!res.ok) return setUserStatus(await errorText(res));
    const body = (await res.json()) as { users: UserRow[] };
    if (seq !== searchSeq.current) return;
    setUsers(body.users);
    setDraftRoles(Object.fromEntries(body.users.map((u) => [u.id, u.role])));
    setUserStatus(t('users.found', { count: body.users.length }));
  }

  // List the newest users on first render.
  useEffect(() => {
    void search('');
  }, []);

  async function saveRole(user: UserRow) {
    const role = draftRoles[user.id];
    const res = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) return setUserStatus(await errorText(res));
    setUsers((rows) => rows.map((row) => (row.id === user.id ? { ...row, role } : row)));
    setUserStatus(t('users.saved', { name: displayName(user), role: roleLabel(role) }));
  }

  async function saveLimit() {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dailyAiLimit: Number(limit) }),
    });
    if (!res.ok) return setLimitStatus(await errorText(res));
    const body = (await res.json()) as { dailyAiLimit: number };
    setLimit(String(body.dailyAiLimit));
    setLimitStatus(t('limit.saved', { limit: body.dailyAiLimit }));
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-xl font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
          {t('title')}
        </h1>

        <section className="card-glass rounded-xl p-6" aria-labelledby="users-heading">
          <h2 id="users-heading" className="text-base font-medium" style={{ color: 'var(--t-gold)' }}>
            {t('users.heading')}
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="user-search" className="text-xs" style={{ color: 'var(--t-faint)' }}>
                {t('users.searchLabel')}
              </label>
              <input
                id="user-search"
                className={FIELD}
                style={FIELD_STYLE}
                value={query}
                placeholder={t('users.searchPlaceholder')}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void search(query);
                }}
              />
            </div>
            <button type="button" className={BUTTON} style={BUTTON_STYLE} onClick={() => void search(query)}>
              {t('users.search')}
            </button>
          </div>
          <p role="status" aria-live="polite" className="mt-3 text-sm" style={{ color: 'var(--t-text2)' }}>
            {userStatus}
          </p>
          <ul className="mt-2 divide-y" style={{ borderColor: 'var(--t-border)' }}>
            {users.map((user) => {
              const name = displayName(user);
              const self = user.id === currentUserId;
              return (
                <li key={user.id} className="flex flex-wrap items-end justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm" style={{ color: 'var(--t-text)' }}>
                      {name}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--t-faint)' }}>
                      {user.email ?? t('users.noEmail')} · {t('users.current', { role: roleLabel(user.role) })}
                      {self ? t('users.self') : ''}
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`role-${user.id}`} className="text-xs" style={{ color: 'var(--t-faint)' }}>
                        {t('users.roleLabel', { name })}
                      </label>
                      <select
                        id={`role-${user.id}`}
                        className={FIELD}
                        style={FIELD_STYLE}
                        value={draftRoles[user.id] ?? user.role}
                        disabled={self}
                        onChange={(e) => setDraftRoles((roles) => ({ ...roles, [user.id]: e.target.value as Role }))}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className={BUTTON}
                      style={BUTTON_STYLE}
                      disabled={self || draftRoles[user.id] === user.role}
                      aria-label={t('users.saveAria', { name })}
                      onClick={() => void saveRole(user)}
                    >
                      {t('users.save')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card-glass rounded-xl p-6" aria-labelledby="limit-heading">
          <h2 id="limit-heading" className="text-base font-medium" style={{ color: 'var(--t-gold)' }}>
            {t('limit.heading')}
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--t-faint)' }}>
            {t('limit.note')}
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="daily-ai-limit" className="text-xs" style={{ color: 'var(--t-faint)' }}>
                {t('limit.label')}
              </label>
              <input
                id="daily-ai-limit"
                type="number"
                min={0}
                max={10000}
                step={1}
                className={FIELD}
                style={FIELD_STYLE}
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            </div>
            <button type="button" className={BUTTON} style={BUTTON_STYLE} onClick={() => void saveLimit()}>
              {t('limit.save')}
            </button>
          </div>
          <p role="status" aria-live="polite" className="mt-3 text-sm" style={{ color: 'var(--t-text2)' }}>
            {limitStatus}
          </p>
        </section>
      </div>
    </main>
  );
}
