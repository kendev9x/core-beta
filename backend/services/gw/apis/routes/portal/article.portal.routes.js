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
			"POST /cms/articles/search":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"findAll"
				),
			"GET /cms/articles/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"findArticlesById"
				),
			"POST /cms/articles/searchArticlesByIds":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"searchArticlesByIds"
				),
			"POST /cms/articles/findArticlesByTags":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"findArticlesByTags"
				),
			"GET /cms/articles/getArticles":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"getArticles"
				),
			"GET /cms/getAllArticles":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"getAllArticles"
				),

			"PUT /cms/articles/remove/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"removeArticles"
				),
			"POST /cms/articles":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"createArticles"
				),
			"PUT /cms/articles/:id":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"updateArticles"
				),
			"PUT /cms/article/setIsActive":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"setIsActive"
				),
			"PUT /cms/article/setIsDelete":
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config,
					process.env.BIZ_ARTICLE_NAME,
					"setIsDelete"
				),
		};
	}

	/** Register route setting for product service use at Web Portal */
	registerRoute() {
		const sef = this;
		return {
			path: this.config.defaultPathEndpoint,
			whitelist: ["**"],
			use: [],
			mergeParams: true,
			authentication: false,
			authorization: false,
			autoAliases: true,
			aliases: this.registerAlias(),
			bodyParsers: {
				json: {
					strict: false,
					limit: "1MB",
				},
				urlencoded: {
					extended: true,
					limit: "1MB",
				},
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
			},
		};
	}
}

module.exports = ProductPortalRoutes;
