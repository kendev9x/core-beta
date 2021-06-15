"use strict";
const ApiGateway = require("moleculer-web");
const E = require("moleculer-web").Errors;
const BaseGw = require("./base.gw");
const ResponseCode = require("../../../defined/response-code");
const { MobileRoutes } = require("./routes/");
const {NovaHelpers} = require("../../../libs");
const {resErr} = require("../../../libs/helpers/response.helper");

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
					const functionPath = NovaHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileAuthenticate");
					const result = await ctx.call(functionPath, {params: {route: ctx.span.name}});
					if (result.code !== 200) {
						throw result;
					}
					return result;
				},

				async authorize(ctx, route, req, res) {
					// Get the authenticated user. return this.verifyTokenMobile(ctx);
					const functionPathAuthor = NovaHelpers.RequestHelper
						.genPathByServiceAndActionName(_config, process.env.BIZ_AUTH_NAME, "mobileVerifyToken");
					const user = await ctx.call(functionPathAuthor);
					const {accountId, fullName} = user.data || {};
					const functionPath = NovaHelpers.RequestHelper
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
