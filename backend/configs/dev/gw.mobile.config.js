"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-GW-MOBILE";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.GW_MOBILE_PORT;
module.exports = Config;
