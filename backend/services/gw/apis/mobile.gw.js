"use strict";
const ApiGateway = require("moleculer-web");
const BaseGw = require("./base.gw");
const { MobileRoutes } = require("./routes/");
const {CoreHelpers} = require("../../../libs");

class MobileGw extends BaseGw {
	constructor(broker) {
		super(broker, {name: process.env.GATEWAY_MOBILE_NAME});
		const _config = super.getConfig(process.env.GATEWAY_MOBILE_CONFIG_NAME);
		this.mobileRoutes = new MobileRoutes(_config, broker);
		this.parseServiceSchema({
			name: process.env.GATEWAY_MOBILE_NAME,
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
				routes: this.mobileRoutes.register(),
				onError(req, res, err) {
					this.onGlobalError(req, res, err);
				}
			},
			meta: {
				scalable: true
			},
			methods: {
				async authenticate(ctx, route, req, res) {
					const functionPath = CoreHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileAuthenticate");
					const result = await ctx.call(functionPath, {params: {route: ctx.span.name}});
					if (result.code !== 200) {
						throw result;
					}
					return result;
				},

				async authorize(ctx, route, req, res) {
					const functionPathAuthor = CoreHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileVerifyToken");
					const user = await ctx.call(functionPathAuthor);
					const {accountId, fullName} = user.data || {};
					const functionPath = CoreHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileAuthorization");
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

module.exports = MobileGw;
