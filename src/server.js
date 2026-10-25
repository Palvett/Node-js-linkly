const env = require('./config/env');
const app = require('./app');
const logger = require('./utils/logger');

app.listen(env.port, () => logger.info(`Linkly listening on :${env.port}`));
