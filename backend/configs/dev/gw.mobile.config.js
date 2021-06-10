"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-mobile-gw";
Config.SERVICE_PORT = process.env.GW_MOBILE_PORT;
Config.metrics.reporter.options.port = 42002;
module.exports = Config;
