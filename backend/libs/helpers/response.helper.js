const ResponseCode = require("../../defined/response-code");

class ResponseHelper {
	/** Processing result return to publish actions
	 * @param result data will return
	 * @param code number code
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
	 * @param errorMessage
	 * @param statusCode
	 * @output Error object
	 */
	resErr(code, errorMessage, statusCode) {
		return {
			code,
			message: errorMessage,
			statusCode
		};
	}
}

module.exports = ResponseHelper;