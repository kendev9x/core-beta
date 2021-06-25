const _ = require("lodash");
const { RequestHelper, FunctionHelper } = require("../../../../libs/helpers");

class SettingConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	getSetting(ctx) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config, process.env.BIZ_SETTING_NAME, "internalGetSetting");
		return ctx.call(functionPath)
			.then((result) => {
				return result.data;
			})
			.catch(() => {
				return null;
			});
	}
}

module.exports = SettingConnector;
