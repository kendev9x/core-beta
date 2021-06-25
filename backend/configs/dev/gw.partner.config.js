"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-GW-PARTNER";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.GW_PARTNER_PORT;
module.exports = Config;
