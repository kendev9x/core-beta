const { NovaHelpers } = require("../../../../../libs");
const BaseRoute = require("./base.mobile.routes");

class ProductMobileRoutes extends BaseRoute {
	constructor(config, broker) {
		super(config, broker);
		this.config = config;
		this.logger = broker.logger;
	}

	/** Register all url endpoint published for product service use at Mobile App */
	registerAlias() {
		return {
			"GET /industry":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "mobileGetIndustry"),
			"GET /product/showcase":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "mobileGetProductShowcase"),
			"GET /product/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "mobileGetProductDetailById"),
			"GET /product/sql":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "mobileTestingSql"),
			"POST /product/sql-sp":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_PRODUCT_NAME, "mobileTestingSqlBySP")
		};
	}

	/** Register route setting for product service use at Mobile App */
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
				ctx.meta.headers = req.headers;
				sef.onBeforeCallBase(ctx, route, req, res);
				console.log("KEN");
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

module.exports = ProductMobileRoutes;
