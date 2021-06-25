"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-BIZ-ARTICLE";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.BIZ_ARTICLE_PORT;
/** MONGO CONFIG */
Config.MONGO_URI = process.env.MONGO_URI_ARTICLE;
module.exports = Config;