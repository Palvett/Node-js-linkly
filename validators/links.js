const { z } = require('zod');

const codeSchema = z.string().regex(/^11[A-Za-z0-9_-]{3,16}$/);

const createLinkSchema = z.object({
    target_url: z
        .string()
        .url()
        .refine((u) => /^https?:\/\//i.test(u), 'must be http(s)'),
    code: codeSchema.optional(),
    expires_at: z.string().datetime({ offset: true }).optional(),
});

const codeParamsSchema = z.object({ code: codeSchema });

const clickQuerySchema = z.object({
    after: z.coerce.number().int().positive(),
    limit: z.core.number().int().min(1).max(100).default(20),
});

module.exports = { createLinkSchema, codeParamsSchema, clickQuerySchema };