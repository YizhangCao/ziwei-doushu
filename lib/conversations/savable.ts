// Which of the reading panel's messages a saved conversation keeps (#22): finished exchanges only.
// No imports on purpose: the panel is a 'use client' component and imports this.

export interface PanelMessage {
  role: 'user' | 'assistant';
  content: string;
  hidden?: boolean;
  /** Set on the panel's own failure messages. */
  error?: unknown;
}

export interface SavableMessage {
  role: 'user' | 'assistant';
  content: string;
  hidden: boolean;
}

/**
 * The messages worth saving, in order. Failure messages are the panel's words, not the model's;
 * a reply followed by one was cut off; and a question still waiting for its answer (or a reply
 * still streaming) waits until the exchange finishes, so the saved list always ends on a reply.
 */
export function savableMessages(messages: readonly PanelMessage[]): SavableMessage[] {
  const kept: SavableMessage[] = [];
  messages.forEach((m, i) => {
    if (m.error) return;
    if (m.role === 'assistant' && (m.content === '' || messages[i + 1]?.error)) return;
    kept.push({ role: m.role, content: m.content, hidden: m.hidden ?? false });
  });
  let end = kept.length;
  while (end > 0 && kept[end - 1].role !== 'assistant') end--;
  return kept.slice(0, end);
}
