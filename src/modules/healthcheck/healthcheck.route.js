import { Router } from 'express';
import { getHealth } from './healthcheck.controller.js';

export const healthcheckRouter = Router();

healthcheckRouter.get('/health', getHealth);

healthcheckRouter.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Welcome to the API!',
    documentation: `${req.protocol}://${req.get('host')}/docs`,
  });
});
