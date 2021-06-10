"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const {
	AuthLogModel, ApiKeyModel, DeviceInfoModel
} = require("./models");

const BaseBis = require("../base.biz");

class StartAuthService extends BaseBis {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_AUTH_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_AUTH_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_AUTH_NAME,
			version: this.config.versionEndpoint,
			mixins: [ApiGateway],
			/**
			 * Settings
			 */
			settings: {
				port: this.config.SERVICE_PORT,
				ip: this.config.defaultExposeIP,
				rateLimit: this.config.rateLimit
			},
			dependencies: [],
			actions: {
				genKey: {
					rest: {
						method: "GET"
					},
					async handler(ctx) {
						return await this.actionPublish.mobile.genKey(ctx);
					}
				},
				genToken: {
					rest: {
						method: "POST"
					},
					async handler(ctx) {
						return await this.actionPublish.portal.genToken(ctx);
					}
				},
				verifyToken: {
					rest: {
						method: "POST"
					},
					async handler(ctx) {
						return await this.actionPublish.portal.verifyToken(ctx);
					}
				},
				internalAuthenticate: {
					async handler(ctx) {
						return await this.actionPublish.mobile.internalAuthenticate(ctx);
					}
				},
				internalAuthorization: {
					async handler(ctx) {
						return await this.actionPublish.mobile.internalAuthorization(ctx);
					}
				}
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
				AuthLogModel: new AuthLogModel(dbConnection, plugins, this.logger),
				ApiKeyModel: new ApiKeyModel(dbConnection, plugins, this.logger),
				DeviceInfoModel: new DeviceInfoModel(dbConnection, plugins, this.logger),
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

module.exports = StartAuthService;
