"use strict";
const ApiGateway = require("moleculer-web");
const BaseGw = require("./base.gw");

class FileGW extends BaseGw {
	constructor(broker) {
		super(broker, {name: process.env.GATEWAY_FILE_NAME});
		const _config = super.getConfig(process.env.GATEWAY_FILE_CONFIG_NAME);
		this.parseServiceSchema({
			name: process.env.GATEWAY_FILE_NAME,
			version: _config.versionEndpoint,
			mixins: [ApiGateway],
			settings: {
				port: _config.SERVICE_PORT,
				ip: _config.defaultExposeIP,
				rateLimit: _config.rateLimit,
				routes: [
					{
						path: _config.defaultPathEndpoint,
						whitelist: [
							"**"
						],
						use: [],
						mergeParams: true,
						authentication: false,
						authorization: false,
						autoAliases: true,
						aliases: {
							/** DEFINED ROUTE ENDPOINTS */
						},
						callingOptions: {
							timeout: 1000,
							fallbackResponse: "Static fallback response"
						},
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
							this.onBeforeCall(ctx, route, req, res);
						},

						/** BASE FUNCTIONS PRE-PROCESS RESPONSE
						 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
						 */
						onAfterCall(ctx, route, req, res, data) {
							return this.onAfterCall(ctx, route, req, res, data);
						},

						onError(req, res, err) {
							return this.onError(req, res, err);
						}
					}
				],
			},
			meta: {
				scalable: true
			},
			methods: {
				async authenticate(ctx, route, req) {
					// Read the token from header
					const auth = req.headers["authorization"];
					if (auth && auth.startsWith("Bearer")) {
						const token = auth.slice(7);

						// Check the token. Tip: call a service which verify the token. E.g. `accounts.resolveToken`
						if (token === "123456") {
							// Returns the resolved user. It will be set to the `ctx.meta.user`
							return {id: 1, name: "John Doe"};

						} else {
							// Invalid token
							throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null);
						}

					} else {
						// No token. Throw an error or do nothing if anonymous access is allowed.
						// throw new E.UnAuthorizedError(E.ERR_NO_TOKEN);
						return null;
					}
				},
				async authorize(ctx, route, req) {
					// Get the authenticated user.
					const user = ctx.meta.user;

					// It check the `auth` property in action schema.
					if (req.$action.auth === "required" && !user) {
						throw new ApiGateway.Errors.UnAuthorizedError("NO_RIGHTS", null);
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
}

module.exports = FileGW;
