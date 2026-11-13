import type { SessionUser } from '@/lib/auth/types';
import { requireModifiable } from '@/lib/charts/service';
import { decryptString, encryptString } from '@/lib/crypto';
import { prisma } from '@/lib/db';
import { MAX_CONVERSATION_MESSAGES, type StoredMessage } from '@/lib/validation/conversation-request';

// A saved chart's AI conversation (#22): one per chart and owner. Only the owner reads or
// appends; a practitioner the chart is shared with gets 403, anyone else 404 (requireModifiable).
// Message text is encrypted at rest, because a visitor's questions are personal.

/** Bad input from the caller (400), such as a conversation that would pass the message limit. */
export class ConversationInputError extends Error {
  readonly status = 400 as const;
}

export async function readConversation(sessionUser: SessionUser | null, chartId: string): Promise<StoredMessage[]> {
  const user = await requireModifiable(sessionUser, chartId);
  const conversation = await prisma.conversation.findFirst({
    where: { chartId, userId: user.id },
    include: { messages: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
  });
  return (conversation?.messages ?? []).map((m) => ({ role: m.role, content: decryptString(m.content), hidden: m.hidden }));
}

export async function appendToConversation(
  sessionUser: SessionUser | null,
  chartId: string,
  messages: readonly StoredMessage[],
): Promise<void> {
  const user = await requireModifiable(sessionUser, chartId);
  // Encrypt before the transaction, so a missing key fails before anything is written.
  const sealed = messages.map((m) => ({ role: m.role, content: encryptString(m.content), hidden: m.hidden }));

  await prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findFirst({
      where: { chartId, userId: user.id },
      select: { id: true, _count: { select: { messages: true } } },
    });
    if ((existing?._count.messages ?? 0) + sealed.length > MAX_CONVERSATION_MESSAGES) {
      throw new ConversationInputError(`A conversation holds at most ${MAX_CONVERSATION_MESSAGES} messages`);
    }
    const conversationId =
      existing?.id ?? (await tx.conversation.create({ data: { chartId, userId: user.id }, select: { id: true } })).id;

    // One insert gives every row the same now(), so order comes from explicit times: each
    // message 1 ms after the one before, and never before the newest message already saved.
    const newest = await tx.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const start = Math.max(Date.now(), (newest?.createdAt.getTime() ?? 0) + 1);
    await tx.message.createMany({
      data: sealed.map((m, i) => ({ conversationId, ...m, createdAt: new Date(start + i) })),
    });
    await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  });
}
