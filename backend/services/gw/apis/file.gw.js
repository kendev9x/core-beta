"use strict";
const ApiGateway = require("moleculer-web");
const { NovaHelpers } = require("../../../libs");
const { FileRoutes } = require("./routes/");
const BaseGw = require("./base.gw");

class FileGW extends BaseGw {
	constructor(broker) {
		super(broker, {name: process.env.GATEWAY_FILE_NAME});
		const _config = super.getConfig(process.env.GATEWAY_FILE_CONFIG_NAME);
		this.fileRoutes = new FileRoutes(_config, broker);
		this.parseServiceSchema({
			name: process.env.GATEWAY_FILE_NAME,
			version: _config.versionEndpoint,
			mixins: [ApiGateway],
			settings: {
				port: _config.SERVICE_PORT,
				ip: _config.defaultExposeIP,
				rateLimit: _config.rateLimit,
				cors: {
					origin: "*",
					methods: ["GET", "POST"],
					allowedHeaders: "*",
					exposedHeaders: [],
					credentials: false,
					maxAge: 3600
				},
				routes: this.fileRoutes.register(),
				onError(req, res, err) {
					this.onGlobalError(req, res, err);
				}
			},
			meta: {
				scalable: true
			},
			methods: {
				async authenticate(ctx, route, req, res) {
					try {
						return await this.authenticateMobile(_config, ctx);
					} catch (e) {
						return await this.authenticatePortal(_config, ctx);
					}
				},

				async authorize(ctx, route, req, res) {
					try {
						return await this.authorizationMobile(_config, ctx);
					} catch (e) {
						return await this.authorizationPortal(_config, ctx);
					}
				}
			},
			actions: {},
			events: {},
			created: super.serviceCreated,
			started: super.serviceStarted,
			stopped: super.serviceStopped
		});
	}

	/** PRIVATE FUNCTIONS AUTHENTICATE AND AUTHORIZE */
	async authenticateMobile(_config, ctx) {
		const functionPath = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileAuthenticate");
		const result = await ctx.call(functionPath, {params: {route: ctx.span.name}});
		if (result.code !== 200) {
			throw result;
		}
		return result;
	}

	async authenticatePortal(_config, ctx) {
		const functionPath = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "portalVerifyToken");
		const result = await ctx.call(functionPath, {params: {route: ctx.span.name}});
		if (result.code !== 200) {
			throw result;
		}
		return result.data;
	}

	async authorizationMobile(_config, ctx, req) {
		const functionPathAuthor = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileVerifyToken");
		const user = await ctx.call(functionPathAuthor);
		const {accountId, fullName} = user.data || {};
		const functionPath = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileAuthorization");
		const result = await ctx.call(functionPath, {
			params: {
				route: ctx.span.name,
				accountId,
				actionName: req.$action.name
			}
		});
		if (result.code !== 200) {
			throw result;
		}
		return result;
	}

	async authorizationPortal(_config, ctx, req) {
		const user = ctx.meta.user;
		const {accountId, fullName} = user || {};
		const functionPath = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "portalAuthorize");
		const result = await ctx.call(functionPath, {params: {route: ctx.span.name, accountId, actionName: req.$action.name}});
		if (result.code !== 200) {
			throw result;
		}
		return result;
	}
}

module.exports = FileGW;
