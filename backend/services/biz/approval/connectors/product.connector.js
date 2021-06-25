const _ = require("lodash");
const { RequestHelper, FunctionHelper } = require("../../../../libs/helpers");

class ProductConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	async setProductIsActive(ctx, itemId, isActive = true) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config,
				process.env.BIZ_PRODUCT_NAME, "internalProductSetIsActive");
		return await ctx.call(functionPath,
			{
				body: {
					_id: itemId,
					isActive
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}

	async setEntityIsActive(ctx, itemId, isActive = true) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config,
				process.env.BIZ_PRODUCT_NAME, "internalEntitySetIsActive");
		/** This call set isActive for entity type Project */
		return await ctx.call(functionPath,
			{
				body: {
					_id: itemId,
					isActive
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}
}

module.exports = ProductConnector;
