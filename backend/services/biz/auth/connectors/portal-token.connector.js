const _ = require("lodash");
const { CoreHelpers } = require("../../../../libs");

class PortalTokenConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	async createPortalToken(ctx, data = {}) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = CoreHelpers.RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_ACCOUNT_NAME, "internalPortalTokenCreate");
		return await ctx.call(functionPath,
			{
				body: data
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}

	async getPortalTokenV1ByTokenV2(ctx, tokenV2) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = CoreHelpers.RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_ACCOUNT_NAME, "internalPortalGetTokenV1ByTokenV2");
		return await ctx.call(functionPath,
			{
				body: {
					tokenV2
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}
}

module.exports = PortalTokenConnector;
