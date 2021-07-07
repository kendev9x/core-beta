const _ = require("lodash");
const { CoreHelpers } = require("../../../../libs");

class UserConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	async findUserByUserAndPass(ctx, data = {userName: '', password: ''}) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = CoreHelpers.RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_ACCOUNT_NAME, "internalUserFindByUserAndPass");
		return await ctx.call(functionPath,
			{
				body: data
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}

	async getActionsByUserId(ctx, accountId = '') {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = CoreHelpers.RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_ACCOUNT_NAME, "internalUserGetActionsByUserId");
		return await ctx.call(functionPath,
			{
				body: {
					accountId
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}
}

module.exports = UserConnector;
