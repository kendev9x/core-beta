"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const {
	UserActivityModel
} = require("./models");

const BaseBis = require("../base.biz");

class StartTrackingService extends BaseBis {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_TRACKING_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_TRACKING_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_TRACKING_NAME,
			version: this.config.versionEndpoint,
			mixins: [ApiGateway],
			/**
			 * Settings
			 */
			settings: {
				port: this.config.SERVICE_PORT,
				ip: this.config.defaultExposeIP,
				rateLimit: this.config.rateLimit,
			},
			dependencies: [],
			actions: {

			},
			methods: {
				logUserActivity(paramObj) {
					return this.actionPublish.internal.createAct(paramObj);
				}
			},
			events: {
				"tracking.event.logUserAct": {
					handler(paramObj) {
						this.logUserActivity(paramObj)
							.catch((err) => this.logger.error(err));

					}
				}
			},
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
				UserActivityModel: new UserActivityModel(dbConnection, plugins, this.logger)
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

module.exports = StartTrackingService;
