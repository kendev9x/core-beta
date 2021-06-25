const ResCode = require("../../../../defined/response-code");
const {ResponseHelper, FunctionHelper} = require("../../../../libs/helpers");
const {SystemSettingLogic} = require("../logics");

class InternalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess;
		this.systemSettingLogic = new SystemSettingLogic(mainProcess);
	}

	/** INTERNAL: GET SYSTEM SETTING
	 * @param ctx - Context
	 * @output Promise<T> object: {code, data, message} */
	getSystemSetting(ctx) {
		return this.systemSettingLogic.getSetting()
			.then((result) => result)
			.catch((err) => {
				this.logger.error(err);
				ResponseHelper.resErr(ResCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR);
			});
	}
}

module.exports = InternalPublish;