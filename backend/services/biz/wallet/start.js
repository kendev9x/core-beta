"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const {
	CashWalletModel, BonusWalletModel, CoreSQLModel, TicketModel
} = require("./models");

const BaseBis = require("../base.biz");

class StartWalletService extends BaseBis {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_WALLET_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_WALLET_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_WALLET_NAME,
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
				uploadBamCashs: {
					rest: {
						method: "POST"
					},
					async handler(ctx) {
						return await this.actionPublish.portal.uploadBamCashs(ctx);
					}
				},
				uploadBamBonus: {
					rest: {
						method: "POST"
					},
					async handler(ctx) {
						return await this.actionPublish.portal.uploadBamBonus(ctx);
					}
				},
				createBamTicket: {
					rest: {
						method: "POST"
					},
					async handler(ctx) {
						return await this.actionPublish.mobile.createBamTicket(ctx);
					}
				},
				rejectTicket:{
					rest: {
						method: "POST"
					},
					async handler(ctx) {
						return await this.actionPublish.portal.rejectTicket(ctx);
					}
				},
				getWalletByCustomerId: {
					rest: {
						method: "GET"
					},
					params: {
						customerId: "string",
					},
					async handler(ctx) {
						return await this.actionPublish.portal.getWalletByCustomerId(ctx);
					}
				},
				getWalletByGroupId: {
					rest: {
						method: "GET"
					},
					params: {
						customerId: "string",
						groupWalletId: "string",
					},
					async handler(ctx) {
						return await this.actionPublish.portal.getWalletByGroupId(ctx);
					}
				},
				getWalletById: {
					rest: {
						method: "GET"
					},
					params: {
						walletId: "string",
					},
					async handler(ctx) {
						return await this.actionPublish.portal.getWalletById(ctx);
					}
				},
				getListWallet: {
					rest: {
						method: "GET"
					},
					params: {
						// customerId: "string",
						// code: "string",
						// skip: "number",
						// take: "number",
					},
					async handler(ctx) {
						return await this.actionPublish.portal.getListWallet(ctx);
					}
				},
				getTransactionByWalletId: {
					rest: {
						method: "GET"
					},
					params: {
						walletId: "string",
					},
					async handler(ctx) {
						return await this.actionPublish.portal.getTransactionByWalletId(ctx);
					}
				},
				getTransactionByCustomerId: {
					rest: {
						method: "GET"
					},
					params: {
						customerId: "string",
					},
					async handler(ctx) {
						return await this.actionPublish.portal.getTransactionByCustomerId(ctx);
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
				CashWalletModel: new CashWalletModel(dbConnection, plugins, this.logger),
				BonusWalletModel: new BonusWalletModel(dbConnection, plugins, this.logger),
				CoreSQLModel: new CoreSQLModel(plugins, this.logger),
				TicketModel: new TicketModel(dbConnection, plugins, this.logger)
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

module.exports = StartWalletService;
