import { z } from 'zod';

const codeSchema = z.string().regex(/^[A-Za-z0-9_-]{3,16}$/);

export const createLinkSchema = z.object({
  target_url: z.url().refine((u) => /^https?:\/\//i.test(u), 'must be http(s)'),
  code: codeSchema.optional(),
  expires_at: z.iso.datetime({ offset: true }).optional(),
});

export const codeParamsSchema = z.object({ code: codeSchema });

export const clickQuerySchema = z.object({
  after: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
