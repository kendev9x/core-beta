"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-BIZ-APPROVAL";
Config.SERVICE_PORT = process.env.BIZ_APPROVAL_PORT;
/** MONGO CONFIG */
Config.MONGO_URI = process.env.MONGO_URI_APPROVAL;
module.exports = Config;
