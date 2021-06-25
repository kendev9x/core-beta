const _ = require("lodash");
const { RequestHelper, FunctionHelper } = require("../../../../libs/helpers");

class TrackingConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	logUserActivity(ctx, dataChanged = {}) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_TRACKING_NAME, "internalCreateUserAct");
		ctx.call(functionPath,
			{
				body: {
					service: ctx.service.name,
					action: ctx.action.name,
					username: ctx.meta.userName,
					data: FunctionHelper.isEmpty(dataChanged) ? ctx.params.body : dataChanged
				}
			});
		return true;
	}
}

module.exports = TrackingConnector;
