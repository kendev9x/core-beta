const { NovaHelpers } = require("../../../../../libs");
const BaseRoute = require("./base.portal.routes");

class ProductPortalRoutes extends BaseRoute {
	constructor(config, broker) {
		super(config, broker);
		this.config = config;
	}

	/** Register all url endpoint published for product service use at Web Portal */
	registerAlias() {
		return {
			"GET /product/industry":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "portalIndustryGetAll"),
			"GET /product/":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "portalProductGetList"),
			"GET /product/template":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "portalProductTemplateGetList"),
			"GET /product/template/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "portalProductTemplateGetDetail")
		};
	}

	/** Register route setting for product service use at Web Portal */
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

module.exports = ProductPortalRoutes;
