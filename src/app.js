import express from 'express';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { healthcheckRouter } from './modules/healthcheck/healthcheck.route.js';
import { errorHandler } from './middlewares/error-handler.js';
import { linksRouter } from './modules/links/links.route.js';
import { openapi } from './docs/openapi.js';

export const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use(healthcheckRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(linksRouter);
app.use(errorHandler);
