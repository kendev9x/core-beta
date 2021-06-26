const _ = require("lodash");
const sanitize = require("mongo-sanitize");
const jsonDiff = require("json-diff");

/** Class RequestHelper
 * Handler base functions supporting process requests*/
class RequestHelper {

	/** Get params via context
	 * @param context
	 * @output object params*/
	getParamsByMethodType(context) {
		/** If set config mergeParam = true at setting routes */
		if (context.params && !context.params.query && !context.params.body && !context.params.params) {
			return context.params;
		}
		/** Else will check and get params via method type */
		let params = {};
		if (context.meta.method) {
			switch (context.meta.method) {
				case "GET": {
					params = {...context.params.query, ...context.params.params};
					break;
				}
				case "POST" || "PUT" || "DELETE" || "OPTIONS": {
					params = context.params.body;
					break;
				}
			}
		}
		if (params && !_.isEmpty(params)) {
			return params;
		}
		/** Try for get params if case method type is not set, merge all to a object params */
		params = {...context.params.query, ...context.params.body, ...context.params.params};
		return params;
	}

	/** Generate a full path action
	 * @param configObj object config
	 * @param serviceName name service
	 * @param actionName name of action
	 * @output string full path action */
	genPathByServiceAndActionName(configObj, serviceName, actionName) {
		return `${configObj.versionEndpoint}.${serviceName}.${actionName}`;
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
			info: user._doc || user
		};
	}

	getLanguageCode(context) {
		let languageCode = context.meta.headers["accept-language"];
		if (!languageCode) {
			languageCode = "vi";
		}
		return languageCode;
	}

	/** Sanitize request param
	 * @param req
	 * @output params valid or null*/
	sanitizeParam(req) {
		const params = this.getParamsByMethodType(req);
		const paramOriginal = JSON.stringify(params);
		const paramsCheck = JSON.stringify(sanitize(params));
		const isDiff = jsonDiff.diffString(paramOriginal, paramsCheck);
		if (_.isEmpty(isDiff)) {
			return params;
		}
		return null;
	}
}

module.exports = RequestHelper;