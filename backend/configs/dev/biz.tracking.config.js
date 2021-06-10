"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.MONGO_URI = process.env.MONGO_URI_TRACKING;
Config.SERVICE_PORT = process.env.BIZ_TRACKING_PORT;
module.exports = Config;
