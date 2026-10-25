import { env } from './config/env.js';
import { app } from './app.js';
import { logger } from './utils/logger.js';

app.listen(env.port, () => logger.info(`Linkly listening on :${env.port}`));
