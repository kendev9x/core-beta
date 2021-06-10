const _ = require("lodash");
const { NovaHelpers } = require("../../../libs");

class TrackingConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	async logUserActivity(ctx, dataChanged = {}) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = NovaHelpers.RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_TRACKING_NAME, "internalCreateUserAct");
		return await ctx.call(functionPath,
			{
				body: {
					service: ctx.service.name,
					action: ctx.action.name,
					username: ctx.meta.userName,
					data: _.isEmpty(dataChanged) ? ctx.params.body : dataChanged
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}
}

module.exports = TrackingConnector;
