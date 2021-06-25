"use strict";
const BaseConfig = require("../dev.config");
const Config = BaseConfig;
Config.nodeID = Config.nodeID + "-GW-MOBILE";
Config.SERVICE_PORT = process.env.NODE_PORT || process.env.GW_MOBILE_PORT;
Config.metrics = {
	enabled: true,
	reporter: {
		type: "Prometheus",
		options: {
			port: 9998,
			path: "/metrics",
			defaultLabels: registry => ({
				namespace: registry.broker.namespace,
				nodeID: registry.broker.nodeID
			})
		}
	}
};
module.exports = Config;
