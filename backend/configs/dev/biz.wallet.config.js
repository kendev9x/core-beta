"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-BIZ-WALLET";
Config.MONGO_URI = process.env.MONGO_URI_WALLET;
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.BIZ_WALLET_PORT;
// Config.metrics.enabled = false;
module.exports = Config;
