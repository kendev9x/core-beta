const _ = require("lodash");
const { NovaHelpers } = require("../../../../libs");

class CustomerConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	async findProfileByPhone(ctx, phone) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_ACCOUNT_NAME, "internalProfileFindByPhone");
		return await ctx.call(functionPath,
			{
				body: {
					phone
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}
}

module.exports = CustomerConnector;
