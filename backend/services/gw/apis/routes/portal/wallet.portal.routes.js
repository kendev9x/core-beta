const { NovaHelpers } = require("../../../../../libs");
const BaseRoute = require("./base.portal.routes");

class WalletPortalRoutes extends BaseRoute {
	constructor(config, broker) {
		super(config, broker);
		this.config = config;
	}

	/** Register all url endpoint published for account service use at Mobile App */
	registerAlias() {
		return {
			"POST /wallet-cash/upload": "multipart:" + 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "uploadBamCashs"),
			"POST /wallet-bonus/upload": "multipart:" + 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "uploadBamBonus"),
			"POST /ticket/reject":  
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "rejectTicket"),
					
			"GET /wallet/:customerId": 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "getWalletByCustomerId"),
			"GET /wallet": 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "getWalletByGroupId"),
			"GET /wallet-pocket": 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "getWalletById"),
			"GET /wallets": 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "getListWallet"),
			"GET /transactions/:walletId": 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "getTransactionByWalletId"),
			"GET /customer/transactions/:customerId": 
				NovaHelpers.RequestHelper.genPathByServiceAndActionName(
					this.config, process.env.BIZ_WALLET_NAME, "getTransactionByCustomerId"),
					
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
			authentication: false,
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

module.exports = WalletPortalRoutes;
