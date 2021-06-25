const VNPAYSMSGateway = require("./vnpay/sms-gateway.connector");
const ElasticSearch = require("./elastic/elastic.connector");
const CrmConnector = require("./crm/crm.connector");
const SFConnector = require("./sf/sf.connector");
const AlertConnector = require("./alert/alert.connector");
const NovaIdConnector = require("./nid/nid.connector");
const RedisConnector = require("./redis/redis.connector");

module.exports = {
	VNPAYSMSGateway,
	ElasticSearch,
	CrmConnector,
	SFConnector,
	AlertConnector,
	NovaIdConnector,
	RedisConnector
};
