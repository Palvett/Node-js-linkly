const pino = require('pino');
const env = require('../config/env');
module.exports = pino({ level: env.logLevel });
