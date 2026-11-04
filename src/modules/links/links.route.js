import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { createLinkSchema, codeParamsSchema, clickQuerySchema } from './links.schema.js';
import * as controller from './links.controller.js';

export const linksRouter = Router();

linksRouter.post('/links', validate(createLinkSchema, 'body'), controller.createLink);
linksRouter.get('/links/:code', validate(codeParamsSchema, 'params'), controller.getLink);
linksRouter.delete('/links/:code', validate(codeParamsSchema, 'params'), controller.deleteLink);

linksRouter.get('/links/:code/clicks', validate(codeParamsSchema, 'params'), validate(clickQuerySchema, 'query'), controller.listClicks);
linksRouter.get('/links/:code/clicks.csv', validate(codeParamsSchema, 'params'), controller.exportClicksCsv);
linksRouter.get('/:code', validate(codeParamsSchema, 'params'), controller.redirect);
