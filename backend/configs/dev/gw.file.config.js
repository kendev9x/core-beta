"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-GW-FILE";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.GW_FILE_PORT;
module.exports = Config;
