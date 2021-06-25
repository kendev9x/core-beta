"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { ArticleModel } = require("./models");
const BaseBis = require("../base.biz");

class StartProductService extends BaseBis {
	constructor(broker) {
		super(broker, { name: process.env.BIZ_ARTICLE_NAME });
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_ARTICLE_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_ARTICLE_NAME,
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
				},
			},
			dependencies: [],
			actions: {
				createArticles: {
					handler(ctx) {
						return this.actionPublish.portal.createArticles(ctx);
					},
				},
				updateArticles: {
					handler(ctx) {
						this.actionPublish.portal.updateArticles(ctx);
					},
				},
				findArticles: {
					handler(ctx) {
						this.actionPublish.portal.findArticles(ctx);
					},
				},
				findArticlesByIds: {
					handler(ctx) {
						this.actionPublish.portal.findArticlesByIds(ctx);
					},
				},
				findArticlesByTags: {
					handler(ctx) {
						this.actionPublish.portal.findArticlesByTags(ctx);
					},
				},
				getArticles: {
					handler(ctx) {
						this.actionPublish.portal.getArticles(ctx);
					},
				},
				getAllArticles: {
					handler(ctx) {
						this.actionPublish.portal.getAllArticles(ctx);
					},
				},
				getArticlesById: {
					handler(ctx) {
						this.actionPublish.portal.getArticlesById(ctx);
					},
				},
				removeArticles: {
					handler(ctx) {
						this.actionPublish.portal.removeArticles(ctx);
					},
				},
			},
			events: {},
			methods: {},
			created: super.serviceCreated,
			started: super.serviceStarted,
			stopped: super.serviceStopped,
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
				ArticleModel: new ArticleModel(
					dbConnection,
					plugins,
					this.logger
				),
			};
			/** Init logic process class */
			this.actionPublish = _publish.init({
				logger: this.logger,
				config: this.config,
				dbMain: dbConnection,
				models,
			});
		});
	}
}

module.exports = StartProductService;
