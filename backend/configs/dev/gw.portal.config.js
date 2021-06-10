"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-portal-gw";
Config.SERVICE_PORT = process.env.GW_PORTAL_PORT;
module.exports = Config;
