"use strict";
const ApiGateway = require("moleculer-web");
const BaseGw = require("./base.gw");
const { CoreHelpers } = require("../../../libs");
const { PortalRoutes } = require("./routes/");

class PortalGw extends BaseGw {
	constructor(broker) {
		super(broker, {name: process.env.GATEWAY_PORTAL_NAME});
		const _config = this.getConfig(process.env.GATEWAY_PORTAL_CONFIG_NAME);
		this.portalRoutes = new PortalRoutes(_config, broker);
		this.parseServiceSchema({
			name: process.env.GATEWAY_PORTAL_NAME,
			version: _config.versionEndpoint,
			mixins: [ApiGateway],
			settings: {
				port: _config.SERVICE_PORT,
				ip: _config.defaultExposeIP,
				rateLimit: _config.rateLimit,
				cors: {
					origin: "*",
					methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
					allowedHeaders: "*",
					exposedHeaders: [],
					credentials: false,
					maxAge: 3600
				},
				routes: this.portalRoutes.register(),
				onError(req, res, err) {
					this.onGlobalError(req, res, err);
				}
			},
			meta: {
				scalable: true
			},
			methods: {
				async authenticate(ctx, route, req) {
					const functionPath = CoreHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "portalVerifyToken");
					const result = await ctx.call(functionPath, {params: {route: ctx.span.name}});
					if (result.code !== 200) {
						throw result;
					}
					return result.data;
				},
				async authorize(ctx, route, req) {
					// Get the authenticated user.
					const user = ctx.meta.user;
					const {accountId, fullName} = user || {};
					const functionPath = CoreHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "portalAuthorize");
					const result = await ctx.call(functionPath, {params: {route: ctx.span.name, accountId, actionName: req.$action.name}});
					if (result.code !== 200) {
						throw result;
					}
					return result;
				}
			},
			actions: {},
			events: {},
			created: super.serviceCreated,
			started: super.serviceStarted,
			stopped: super.serviceStopped
		});
	}
}

module.exports = PortalGw;
