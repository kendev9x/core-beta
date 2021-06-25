const { NovaHelpers } = require("../../../../../libs");
const BaseRoute = require("./base.file.routes");

class FilePrivateRoutes extends BaseRoute {
	constructor(config, broker) {
		super(config, broker);
		this.config = config;
	}

	/** Register all url endpoint published for account service use at Mobile App */
	registerAlias() {
		return {
			"POST /upload-private/": {
				type: "multipart",
				action: NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "uploadFilePrivate")
			},
			"GET /private/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "getFilePrivate"),
			"GET /thumbnail/private/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_FILE_NAME, "getFilePrivateThumbnail"),
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
			authorization: true,
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

module.exports = FilePrivateRoutes;
