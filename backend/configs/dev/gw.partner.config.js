"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.SERVICE_PORT = process.env.GW_PARTNER_PORT;
module.exports = Config;
