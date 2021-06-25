"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-BIZ-FILE";
Config.SERVICE_PORT = process.env.BIZ_FILE_PORT;
/** MONGO CONFIG */
Config.MONGO_URI = process.env.MONGO_URI_FILE;
module.exports = Config;

