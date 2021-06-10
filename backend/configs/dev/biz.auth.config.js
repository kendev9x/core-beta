"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.MONGO_URI = process.env.MONGO_URI_AUTH;
Config.SERVICE_PORT = process.env.BIZ_AUTH_PORT;
Config.metrics.enabled = false;
module.exports = Config;
