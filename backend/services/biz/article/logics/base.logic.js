// Tan created 22/06/2020
const _ = require("lodash");

class BaseService {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
	}

	async getCurrentUser(ctx) {
		const { user } = ctx.meta;
		if (!user) {
			return {};
		}
		return {
			userName: ctx.meta.userName,
			userId: ctx.meta.userId,
			info: user._doc || {},
		};
	}

	getParamsByMethodType(context) {
		let params = {};
		if (
			context.params.query &&
			(!context.params.body || _.isEmpty(context.params.body)) &&
			(!context.params.params || _.isEmpty(context.params.params))
		) {
			params = context.params.query;
		} else if (context.params.body && _.isEmpty(context.params.params)) {
			params = context.params.body;
		} else if (context.params.params) {
			params = context.params.params;
		}
		params = _.isUndefined(params) ? {} : params;
		return params;
	}

	getLanguage(context) {
		let lang = "vi";
		if (!_.isUndefined(context.meta.headers["Accept-Language"])) {
			lang = context.meta.headers["Accept-Language"];
		}
		return lang;
	}

	getLanguageCode(context) {
		let languageCode = context.meta.headers["accept-language"];
		if (!languageCode) {
			languageCode = "vi";
		}
		return languageCode;
	}

	/** Process data for return api */
	resolveReturn(result, isSuccess = true, messageErr = "") {
		return {
			isSuccess,
			result,
			messageErr,
		};
	}
}

module.exports = BaseService;
