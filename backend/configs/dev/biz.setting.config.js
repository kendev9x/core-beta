"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-BIZ-SETTING";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.BIZ_SETTING_PORT;
/** MONGO CONFIG */
// Config.MONGO_URI = "mongodb://novaAdmin:123456789@10.16.21.1:27017/nvlp-dev?authSource=admin";
Config.MONGO_URI = process.env.MONGO_URI_SETTING;
/** ELASTIC CONFIG */
Config.ELASTIC_URI = "http://10.16.21.2:9200";
Config.ELASTIC_TIMEOUT = "5000";
Config.ELASTIC_INDEX_PRODUCT_BDS = "nvlp-dev-products-bds";
Config.ELASTIC_INDEX_PRODUCT_FITNESS = "nvlp-dev-products-citigym";
Config.ELASTIC_INDEX_PRODUCT_FAB = "nvlp-dev-products-fab";
Config.ELASTIC_INDEX_PRODUCT_ECM = "nvlp-dev-products-ecm";
module.exports = Config;
