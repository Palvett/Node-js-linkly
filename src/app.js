import express from 'express';
import morgan from 'morgan';
import { healthcheckRouter } from './modules/healthcheck/healthcheck.route.js';

export const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use(healthcheckRouter);
