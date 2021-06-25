"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-GW-SYNCHRONIZE";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.GW_SYNC_PORT;
module.exports = Config;
