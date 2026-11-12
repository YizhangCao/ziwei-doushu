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

type Role = 'member' | 'practitioner' | 'admin';

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  githubId: string | null;
  role: Role;
  createdAt: string;
}

const ROLE_LABELS: Record<Role, string> = { member: '会员', practitioner: '执业者', admin: '管理员' };
const BUTTON = 'rounded-full px-4 py-1.5 text-sm focus:outline-none focus-visible:ring-2 disabled:opacity-50';
const FIELD = 'rounded-lg bg-transparent px-3 py-1.5 text-sm focus:outline-none focus-visible:ring-2';
const FIELD_STYLE = { border: '1px solid var(--t-border)', color: 'var(--t-text)' };
const BUTTON_STYLE = { border: '1px solid var(--t-border)', color: 'var(--t-gold)' };

const displayName = (user: UserRow) => user.name ?? user.email ?? user.githubId ?? user.id;

/** The `{ error }` message of a failed response, or its status. */
async function errorText(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') {
      return (body as { error: string }).error;
    }
  } catch {
    // Not JSON: fall through to the status.
  }
  return `请求失败（${res.status}）`;
}

/**
 * Renders the two admin sections. Each has its own live status line, so screen
 * readers announce the result of a search or a save.
 */
export default function AdminPanel({ initialDailyAiLimit, currentUserId }: { initialDailyAiLimit: number; currentUserId: string }) {
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
    setUserStatus('正在搜索…');
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    if (seq !== searchSeq.current) return;
    if (!res.ok) return setUserStatus(await errorText(res));
    const body = (await res.json()) as { users: UserRow[] };
    if (seq !== searchSeq.current) return;
    setUsers(body.users);
    setDraftRoles(Object.fromEntries(body.users.map((u) => [u.id, u.role])));
    setUserStatus(`找到 ${body.users.length} 位用户`);
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
    setUserStatus(`已将 ${displayName(user)} 设为${ROLE_LABELS[role]}`);
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
    setLimitStatus(`每日上限已设为 ${body.dailyAiLimit} 次`);
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <h1 className="text-xl font-medium tracking-widest" style={{ color: 'var(--t-gold)' }}>
          管理后台
        </h1>

        <section className="card-glass rounded-xl p-6" aria-labelledby="users-heading">
          <h2 id="users-heading" className="text-base font-medium" style={{ color: 'var(--t-gold)' }}>
            用户与角色
          </h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="user-search" className="text-xs" style={{ color: 'var(--t-faint)' }}>
                搜索用户
              </label>
              <input
                id="user-search"
                className={FIELD}
                style={FIELD_STYLE}
                value={query}
                placeholder="名字、邮箱或 GitHub id"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void search(query);
                }}
              />
            </div>
            <button type="button" className={BUTTON} style={BUTTON_STYLE} onClick={() => void search(query)}>
              搜索
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
                      {user.email ?? '没有邮箱'} · 当前：{ROLE_LABELS[user.role]}
                      {self ? '（你自己，不能修改）' : ''}
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex flex-col gap-1">
                      <label htmlFor={`role-${user.id}`} className="text-xs" style={{ color: 'var(--t-faint)' }}>
                        {name} 的角色
                      </label>
                      <select
                        id={`role-${user.id}`}
                        className={FIELD}
                        style={FIELD_STYLE}
                        value={draftRoles[user.id] ?? user.role}
                        disabled={self}
                        onChange={(e) => setDraftRoles((roles) => ({ ...roles, [user.id]: e.target.value as Role }))}
                      >
                        {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className={BUTTON}
                      style={BUTTON_STYLE}
                      disabled={self || draftRoles[user.id] === user.role}
                      aria-label={`保存 ${name} 的角色`}
                      onClick={() => void saveRole(user)}
                    >
                      保存
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card-glass rounded-xl p-6" aria-labelledby="limit-heading">
          <h2 id="limit-heading" className="text-base font-medium" style={{ color: 'var(--t-gold)' }}>
            每日 AI 次数上限
          </h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--t-faint)' }}>
            按 UTC 自然日计算；设为 0 会暂停所有 AI 解读。另有每人、每个 IP 每小时 20 次的限制。
          </p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="daily-ai-limit" className="text-xs" style={{ color: 'var(--t-faint)' }}>
                每位用户每天最多 AI 解读次数
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
              保存上限
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
