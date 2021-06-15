const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const {APP_SETTING} = require("../defined");
const { RequestHelper, FunctionHelper } = require("../../../../libs/helpers");

class BaseLogic {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.productTemplateModel = this.mainProcess.models.ProductTemplateModel;
		this.entityModel = this.mainProcess.models.EntityModel;
		this.roleModel = this.mainProcess.models.RoleModel;
	}

	/** Processing result return to publish actions
	 * @param code number code
	 * @param result data will return
	 * @param message
	 * @output { code, data, message }
	 */
	resInfo(result, code = ResponseCode.SYS_STATUS_CODE.OK, message = "Successful") {
		return {
			code,
			data: result,
			message
		};
	}

	/** Processing result return to publish actions
	 * @param code number code
	 * @param error object error
	 * @output Error object
	 */
	resErr(code, error) {
		error.code = code;
		return error;
	}

	/** Private functions use for this service */
	getCurrentAccount(context) {
		const { user } = context.meta;
		if (!user) {
			return {};
		}
		return {
			userName: context.meta.userName,
			userId: context.meta.userId,
			info: user._doc || {}
		};
	}

	getLanguageCode(context) {
		let languageCode = context.meta.headers["accept-language"];
		if (!languageCode) {
			languageCode = APP_SETTING.DEFAULT_LANGUAGE_CODE;
		}
		return languageCode;
	}
}

module.exports = BaseLogic;
