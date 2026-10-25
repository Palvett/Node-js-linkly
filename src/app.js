import express from 'express';
import morgan from 'morgan';
import { healthcheckRouter } from './modules/healthcheck/healthcheck.route.js';
import { errorHandler } from './middlewares/error-handler.js';
import { linksRouter } from './modules/links/links.route.js';

export const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use(healthcheckRouter);
app.use(linksRouter);
app.use(errorHandler);
