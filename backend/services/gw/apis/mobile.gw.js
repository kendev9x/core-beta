"use strict";
const ApiGateway = require("moleculer-web");
const E = require("moleculer-web").Errors;
const BaseGw = require("./base.gw");
const { MobileRoutes } = require("./routes/");
const {NovaHelpers} = require("../../../libs");

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
					const functionPath = NovaHelpers.RequestHelper.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "internalAuthenticate");

					const result = await ctx.call(functionPath, {params: {route: ctx.span.name}});
					if (result.code !== 200) {
						throw result;
					}
					return result;
				},
				async authorize(ctx, route, req, res) {
					// const functionPath = NovaHelpers.RequestHelper
					// 	.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME,
					// 		"internalAuthorization");
					// return await ctx.call(functionPath);
					return true;
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
