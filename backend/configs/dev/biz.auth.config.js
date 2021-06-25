"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-BIZ-AUTH";
Config.MONGO_URI = process.env.MONGO_URI_AUTH;
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.BIZ_AUTH_PORT;
module.exports = Config;
