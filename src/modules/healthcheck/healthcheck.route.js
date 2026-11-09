import { Router } from 'express';
import { getHealth } from './healthcheck.controller.js';

export const healthcheckRouter = Router();

healthcheckRouter.get('/health', getHealth);
