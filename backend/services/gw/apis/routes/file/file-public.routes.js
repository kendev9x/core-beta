const { CoreHelpers } = require("../../../../../libs");
const BaseRoute = require("./base.file.routes");

class FilePublicRoutes extends BaseRoute {
	constructor(config, broker) {
		super(config, broker);
		this.config = config;
	}

	/** Register all url endpoint published for account service use at Mobile App */
	registerAlias() {
		return {
			"POST /upload": {
				type: "multipart",
				action: CoreHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "uploadFile")
			},
			"POST /upload-360": {
				type: "multipart",
				action: CoreHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "uploadFile360")
			},
			"GET /:id":
				CoreHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "getFile"),
			"GET /thumbnail/:id":
				CoreHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "getFileThumbnail"),
		};
	}

	/** Register route setting for account service use at Mobile App */
	registerRoute() {
		const sef = this;
		return {
			path: this.config.defaultPathEndpoint,
			whitelist: [
				"**"
			],
			use: [],
			mergeParams: true,
			authentication: true,
			authorization: false,
			autoAliases: true,
			aliases: this.registerAlias(),
			bodyParsers: {
				json: {
					strict: false,
					limit: "1MB"
				},
				urlencoded: {
					extended: true,
					limit: "1MB"
				}
			},
			mappingPolicy: "all", // Available values: "all", "restrict"
			logging: true,
			/** BASE FUNCTIONS PRE-PROCESS REQUEST
			 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
			 */
			onBeforeCall(ctx, route, req, res) {
				sef.onBeforeCallBase(ctx, route, req, res);
			},

			/** BASE FUNCTIONS PRE-PROCESS RESPONSE
			 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
			 */
			onAfterCall(ctx, route, req, res, data) {
				return sef.onAfterCallBase(ctx, route, req, res, data);
			},

			onError(req, res, err) {
				return sef.onErrorBase(req, res, err);
			}
		};
	}
}

module.exports = FilePublicRoutes;
