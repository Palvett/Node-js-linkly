import { z } from 'zod';

const RESERVED_CODES = new Set(['health', 'docs']);

const codeSchema = z.string().regex(/^[A-Za-z0-9_-]{3,16}$/);

// Express matches routes case-insensitively,  so /Docs also reaches Swagger.
// Compare in lower case, and only on create: lookups should still return 404.
const vanityCodeSchema = codeSchema.refine((c) => !RESERVED_CODES.has(c.toLowerCase()), 'code is reserved');

export const createLinkSchema = z.strictObject({
  target_url: z.url().refine((u) => /^https?:\/\//i.test(u), 'must be http(s)'),
  code: vanityCodeSchema.optional(),
  expires_at: z.iso
    .datetime({ offset: true })
    .refine((value) => new Date(value) > new Date(), 'expires_at must be in the future')
    .optional(),
});

export const codeParamsSchema = z.object({ code: codeSchema });

export const clickQuerySchema = z.object({
  after: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
