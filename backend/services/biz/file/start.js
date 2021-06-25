"use strict";
const ApiGateway = require("moleculer-web");
const _publish = require("./publish");
const MongoDbHandler = require("./dbHandler/mongoDb");
const mongoosePaginate = require("mongoose-paginate-v2");
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const {
	FilePrivateModel
} = require("./models");
const BaseBiz = require("../base.biz");

class StartFileService extends BaseBiz {
	constructor(broker) {
		super(broker, {name: process.env.BIZ_FILE_NAME});
		/** Get config of service */
		this.config = super.getConfig(process.env.BIZ_FILE_CONFIG_NAME);
		this.initService();
		this.parseServiceSchema({
			name: process.env.BIZ_FILE_NAME,
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
				 * File: Upload file
				 * @param {ctx}: context obj
				 */
				uploadFile: {
					rest: {
						method: "POST",
					},
					handler(ctx) {
						return this.actionPublish.file.uploadFile(ctx);
					}
				},
				/**
				 * File: Upload file
				 * @param {ctx}: context obj
				 */
				uploadFile360: {
					rest: {
						method: "POST",
					},
					handler(ctx) {
						return this.actionPublish.file.uploadFile360(ctx);
					}
				},
				/**
				 * File: Upload file private
				 * @param {ctx}: context obj
				 */
				uploadFilePrivate: {
					rest: {
						method: "POST",
					},
					handler(ctx) {
						return this.actionPublish.file.uploadFile(ctx);
					}
				},
				/**
				 * File: Get file original
				 * @param {ctx}: context obj
				 */
				getFile: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.file.getFile(ctx);
					}
				},
				/**
				 * File: Get file thumbnail
				 * @param {ctx}: context obj
				 */
				getFileThumbnail: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.file.getFileThumbnail(ctx);
					}
				},
				/**
				 * File: Get file private original
				 * @param {ctx}: context obj
				 */
				getFilePrivate: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.file.getPrivateFile(ctx);
					}
				},
				/**
				 * File: Get file private original
				 * @param {ctx}: context obj
				 */
				getFilePrivateThumbnail: {
					rest: {
						method: "GET",
					},
					handler(ctx) {
						return this.actionPublish.file.getPrivateFileThumbnail(ctx);
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
				FilePrivateModel: new FilePrivateModel(dbConnection, plugins, this.logger),
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

module.exports = StartFileService;
