"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {
	IndustryModel,
	ProductTemplateModel,
	ProductModel,
	ProductFilterConfigModel,
	EntityTypeModel,
	EntityModel,
	RelationTypeModel,
	RelationModel,
	ProductCustomerModel
} = require("./models");
const BaseBiz = require("../base.biz");

class StartProductService extends BaseBiz {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_PRODUCT_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_PRODUCT_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_PRODUCT_NAME,
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
				 * Mobile app: Get all industry
				 * @param {ctx}: context obj
				 */
				mobileIndustryGetAll: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.mobile.industryGetAll(ctx);
					}
				},
				/**
				 * Mobile app: Get all industry
				 * @param {ctx}: context obj
				 */
				mobileProductGetShowcase: {
					rest: {
						method: "GET",
					},
					params: {
						industry: "string|optional",
					},
					handler(ctx) {
						return this.actionPublish.mobile.productListShowcase(ctx);
					}
				},
				/**
				 * Mobile app: Get detail product by id
				 * @param {ctx}: context obj
				 */
				mobileProductGetDetailById: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.mobile.productDetail(ctx);
					}
				},
				/**
				 * Mobile app: Testing sql query
				 * @param {ctx}: context obj
				 */
				mobileTestingSql: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.mobile.getListDataSql(ctx);
					}
				},
				/**
				 * Mobile app: Testing sql query
				 * @param {ctx}: context obj
				 */
				mobileTestingSqlBySP: {
					rest: {
						method: "POST",
					},
					handler(ctx) {
						return this.actionPublish.mobile.getListDataSqlBySP(ctx);
					}
				},
				/**
				 * Portal: Get all industry
				 * @param {ctx}: context obj
				 */
				portalIndustryGetAll: {
					rest: {
						method: "GET"
					},
					handler(ctx) {
						return this.actionPublish.portal.industryGetAll(ctx);
					}
				},
				/**
				 * Portal: Get all industry
				 * @param {ctx}: context obj
				 */
				portalProductGetList: {
					rest: {
						method: "GET"
					},
					handler(ctx) {
						return this.actionPublish.portal.productGetListPaging(ctx);
					}
				},
				/**
				 * Portal: Get all industry
				 * @param {ctx}: context obj
				 */
				portalProductTemplateGetList: {
					rest: {
						method: "GET"
					},
					handler(ctx) {
						return this.actionPublish.portal.productTemplateGetListPaging(ctx);
					}
				},
				/**
				 * Portal: Get all industry
				 * @param {ctx}: context obj
				 */
				portalProductTemplateGetDetail: {
					rest: {
						method: "GET"
					},
					handler(ctx) {
						return this.actionPublish.portal.productTemplateGetDetail(ctx);
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
				IndustryModel: new IndustryModel(dbConnection, plugins, this.logger),
				ProductModel: new ProductModel(dbConnection, plugins, this.logger),
				ProductTemplateModel: new ProductTemplateModel(dbConnection, plugins, this.logger),
				ProductFilterConfigModel: new ProductFilterConfigModel(dbConnection, plugins, this.logger),
				EntityModel: new EntityModel(dbConnection, plugins, this.logger),
				EntityTypeModel: new EntityTypeModel(dbConnection, plugins, this.logger),
				RelationModel: new RelationModel(dbConnection, plugins, this.logger),
				RelationTypeModel: new RelationTypeModel(dbConnection, plugins, this.logger),
				ProductCustomerModel: new ProductCustomerModel(dbConnection, plugins, this.logger)
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

module.exports = StartProductService;
