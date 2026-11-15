// What /api/interpret accepts. The route's validator and the reading panel both read these,
// so the panel can say why a question can't be sent instead of failing with a 400.
// No imports on purpose: a 'use client' file imports this, and it must carry no server code.

export const MAX_MESSAGES = 30;
/** A question the visitor types (#5). */
export const MAX_USER_CHARS = 2000;
/**
 * One of the model's own earlier replies, sent back as history. A follow-up such as "say that
 * again in Chinese" needs the whole reply, and an English reading runs about 5,500 characters.
 */
export const MAX_ASSISTANT_CHARS = 20000;
/** Every message together, so one long conversation can't run up the bill. */
export const MAX_TOTAL_CHARS = 100000;

export interface LimitedMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function fitsInterpretLimits(messages: readonly LimitedMessage[]): boolean {
  if (messages.length > MAX_MESSAGES) return false;
  let total = 0;
  for (const { role, content } of messages) {
    if (content.length > (role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS)) return false;
    total += content.length;
  }
  return total <= MAX_TOTAL_CHARS;
}

/**
 * The history the reading panel sends: what the visitor and the model actually said. Failure
 * messages are the panel's own words, so they stay on screen and never reach the model. A reply
 * longer than the limit keeps its opening, which is better than a request that can't be sent.
 */
export function toInterpretHistory(
  messages: readonly (LimitedMessage & { error?: unknown })[],
): LimitedMessage[] {
  return messages
    .filter((m) => !m.error)
    .map(({ role, content }) => ({
      role,
      content: role === 'assistant' ? content.slice(0, MAX_ASSISTANT_CHARS) : content,
    }));
}
