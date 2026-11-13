import { z } from 'zod';

// Request body for POST /api/charts/[id]/conversation (#22). The limits match what /api/interpret
// accepts after #105, so a saved conversation can always be sent back as history: 30 messages,
// 2,000 characters for what the visitor types, 20,000 for one of the model's replies.

export const MAX_CONVERSATION_MESSAGES = 30;
const MAX_USER_CHARS = 2000;
const MAX_ASSISTANT_CHARS = 20000;

const storedMessageSchema = z
  .object(
    {
      role: z.enum(['user', 'assistant'], { error: 'role must be user or assistant' }),
      content: z.string({ error: 'content must be text' }).min(1, 'content must not be empty'),
      hidden: z.boolean({ error: 'hidden must be true or false' }).default(false),
    },
    { error: 'each message must be an object' },
  )
  .refine((m) => m.content.length <= (m.role === 'user' ? MAX_USER_CHARS : MAX_ASSISTANT_CHARS), {
    message: `a question is at most ${MAX_USER_CHARS} characters, a reply at most ${MAX_ASSISTANT_CHARS}`,
  });

export const appendConversationBodySchema = z.object(
  {
    messages: z
      .array(storedMessageSchema, { error: 'messages must be a list' })
      .min(1, 'messages must not be empty')
      .max(MAX_CONVERSATION_MESSAGES, `at most ${MAX_CONVERSATION_MESSAGES} messages`),
  },
  { error: 'Request body must be a JSON object' },
);

export type StoredMessage = z.output<typeof storedMessageSchema>;
