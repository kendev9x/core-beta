const request = require("request-promise");
const {FunctionHelper} = require("../../libs/helpers");
let _NID_URL_ENDPOINT = "https://nvpstage.novaland.com.vn/api/v2";
if (process.env.ENVIROMENT === "DEV") {
	_NID_URL_ENDPOINT = "https://nvpstage.novaland.com.vn/api/v2";
} else if (process.env.ENVIROMENT === "STAGING") {
	_NID_URL_ENDPOINT = "https://nvpstage.novaland.com.vn/api/v2";
} else if (process.env.ENVIROMENT === "UAT") {
	_NID_URL_ENDPOINT = "https://nvpuat.novaland.com.vn/api/v2";
} else if (process.env.ENVIROMENT === "PROD") {
	_NID_URL_ENDPOINT = "https://nvp.novaland.com.vn/api/v2";
}
const _NID_URL_ENDPOINT_GET_TOKEN = `${_NID_URL_ENDPOINT}/account/generateToken`;
const _NID_USERNAME = process.env.NID_USERNAME;
const _NID_PASSWORD = process.env.NID_PASSWORD;

class NidConnector {
	constructor(mainProcess) {
		this.logger = mainProcess.logger;
	}

	getToken(tryTime = 0, userName = '', password = '') {
		return new Promise((res, rej) => {
			const requestObj = {
				method: "POST",
				uri: _NID_URL_ENDPOINT_GET_TOKEN,
				body: {
					userName: userName || _NID_USERNAME,
					password: password || _NID_PASSWORD
				},
				headers: {
					"Content-Type": "application/json",
					TypeEndPoint: "WEB"
				},
				json: true,
				strictSSL: false
			};
			request(requestObj)
				.then((result) => {
					this.logger.info(JSON.stringify(result));
					if (result.code !== 200 && result.code !== 403 && result.code !== 401) {
						return rej({code: result.code, message: result.message, tryTime: tryTime});
					}
					if (result.code === 403 || result.code === 401) {
						const tryTimeCall = tryTime + 1;
						if (tryTimeCall > 3) {
							return rej({code: result.code, message: result.message, tryTime: tryTimeCall});
						}
						return this.getToken(tryTimeCall);
					}
					if (result.code === 200) {
						return res(result.data);
					}
				}).catch((err) => {
					this.logger.error(JSON.stringify(err));
					rej(err);
				});
		});
	}

	/** CALL API TO NVP
	 * @param apiAction as: /account/getById
	 * @param method as: GET, POST, PUT, DELETE
	 * @param paramBody as: {prop1: ..., prop2: ...} }
	 * @param tokenV1
	 * @output PROMISE<T> as {code, data, message}*/
	async callApi(apiAction, method, paramBody, tokenV1 = "") {
		try {
			const uri = `${_NID_URL_ENDPOINT}/${apiAction}`;
			if (FunctionHelper.isEmpty(apiAction) || FunctionHelper.isEmpty(method)) {
				return {code: 403, message: "Bad request"};
			}
			if (!tokenV1) {
				const resultToken = await this.getToken();
				tokenV1 = resultToken.token;
			}

			const requestObj = {
				method,
				uri,
				body: paramBody,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${tokenV1}`,
					TypeEndPoint: "WEB"
				},
				json: true,
				strictSSL: false
			};
			const result = await request(requestObj);
			return result;
		} catch (err) {
			this.logger.error(err);
		}
	}
}

module.exports = NidConnector;
