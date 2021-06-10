"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.MONGO_URI = process.env.MONGO_URI_ACCOUNT;
Config.SERVICE_PORT = process.env.BIZ_ACCOUNT_PORT;
module.exports = Config;
