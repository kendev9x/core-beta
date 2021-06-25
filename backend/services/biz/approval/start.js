"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {
	ApprovalModel,
	ApprovalConfigModel
} = require("./models");
const BaseBiz = require("../base.biz");

class StartApprovalService extends BaseBiz {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_APPROVAL_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_APPROVAL_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_APPROVAL_NAME,
			version: this.config.versionEndpoint,
			mixins: [ApiGateway],
			/**
			 * Settings
			 */
			settings: {
				port: this.config.SERVICE_PORT,
				ip: this.config.defaultExposeIP,
				rateLimit: this.config.rateLimit,
				logging: true,
				/** Global error handler */
				onError(req, res, err) {
					this.onError(req, res, err);
				}
			},
			dependencies: [],
			actions: {
				/**
				 * Internal: Get setting
				 * @param {ctx}: context obj
				 */
			},
			events: {},
			methods: {},
			created: super.serviceCreated,
			started: super.serviceStarted,
			stopped: super.serviceStopped
		});
	}

	initService() {
		/** Init DB connection */
		const dbHandler = new MongoDbHandler(this.config);
		dbHandler.createConnection((err, dbConnection) => {
			if (err) {
				throw err;
			}
			/** Init models and install plugins use for model*/
			const plugins = [mongoosePaginate, aggregatePaginate];
			const models = {
				ApprovalConfigModel: new ApprovalConfigModel(dbConnection, plugins, this.logger),
				ApprovalModel: new ApprovalModel(dbConnection, plugins, this.logger)
			};
			/** Init logic process class */
			this.actionPublish = _publish.init({
				logger: this.logger,
				config: this.config,
				dbMain: dbConnection,
				models
			});
		});
	}
}

module.exports = StartApprovalService;
