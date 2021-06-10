"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const {
	CustomerModel
} = require("./models");

const BaseBis = require("../base.biz");

class StartAccountService extends BaseBis {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_ACCOUNT_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_ACCOUNT_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_ACCOUNT_NAME,
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
				/**
				 * Mobile app: register customer
				 * @param phone
				 * @param email
				 */
				mobileCustomerRegister: {
					rest: {
						method: "POST"
					},
					params: {
						phone: "string",
						email: "string"
					},
					async handler(ctx) {
						return await this.actionPublish.mobile.register(ctx);
					}
				},
				/**
				 * Mobile app: register customer
				 * @param phone
				 * @param email
				 */
				mobileCustomerFindByPhone: {
					rest: {
						method: "GET"
					},
					params: {
						phone: "string",
					},
					async handler(ctx) {
						return await this.actionPublish.mobile.getByPhone(ctx);
					}
				},
				/**
				 * Portal: Get all customer. Maximum data return is 100 records
				 * @param: optional
				 */
				portalCustomerGetAll: {
					rest: {
						method: "GET"
					},
					async handler(ctx) {
						return this.actionPublish.portal.getListCustomer(ctx);
					}
				},
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
				CustomerModel: new CustomerModel(dbConnection, plugins, this.logger)
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

module.exports = StartAccountService;
