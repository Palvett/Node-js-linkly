import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { createLinkSchema, codeParamsSchema } from './links.schema.js';
import * as controller from './links.controller.js';

export const linksRouter = Router();

linksRouter.post('/links', validate(createLinkSchema, 'body'), controller.createLink);
linksRouter.get('/links/:code', validate(codeParamsSchema, 'params'), controller.getLink);
linksRouter.delete('/links/:code', validate(codeParamsSchema, 'params'), controller.deleteLink);
