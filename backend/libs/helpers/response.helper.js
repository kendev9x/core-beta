const ResponseCode = require("../../defined/response-code");

class ResponseHelper {
	/** Processing result return to publish actions
	 * @param result data will return
	 * @param code number
	 * @param message string
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
	 * @output Error object
	 * @param definedCodeObj: object { CODE, MESSAGE, STATUS_CODE } defined at res-biz.json
	 * @param [objReturn]: object custom failed
	 * @param langCode: language code as en, vi.. Default is en
	 */
	resFailed(definedCodeObj, objReturn = null, langCode = "EN") {
		return {
			code: definedCodeObj.CODE,
			message: definedCodeObj.MESSAGE[langCode.toUpperCase()] || definedCodeObj.MESSAGE.EN,
			statusCode: definedCodeObj.STATUS_CODE,
			data: objReturn
		};
	}


	resFailedFull(definedCodeObj, objReturn = null) {
		return {
			code: definedCodeObj.CODE,
			message: definedCodeObj.MESSAGE,
			statusCode: definedCodeObj.STATUS_CODE,
			data: objReturn
		};
	}

	/** Processing result return to publish actions
	 * @output Error object
	 * @param definedCodeObj: object { CODE, MESSAGE, STATUS_CODE } defined at res-biz.json
	 * @param message: custom message was not defined before
	 * @param [objReturn]: object custom failed
	 * @param langCode: language code as en, vi.. Default is en
	 */
	resFailedWithMessage(definedCodeObj, message = null, objReturn = null, langCode = "EN") {
		return {
			code: definedCodeObj.CODE,
			message: message || definedCodeObj.MESSAGE[langCode.toUpperCase()],
			statusCode: definedCodeObj.STATUS_CODE,
			data: objReturn
		};
	}

	/** Processing result return to publish actions
	 * @param code number code
	 * @param errorMessage
	 * @param statusCode
	 * @output Error object
	 */
	resErr(code, errorMessage, statusCode) {
		return {
			code,
			message: errorMessage,
			statusCode: statusCode || 500
		};
	}
}

module.exports = ResponseHelper;
