const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { NovaHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");
const AuthLogLogic = require("./auth-log.logic");
const DeviceInfoLogic = require("./device-info.logic");
const uuid = require("uuid");
const jwt = require('jsonwebtoken');
const { ResponseHelper } = require("../../../../libs/helpers");

class AuthLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.apiKeyModel = this.models.ApiKeyModel;
		this.authLogLogic = new AuthLogLogic(mainProcess);
		this.deviceInfoLogic = new DeviceInfoLogic(mainProcess);
	}

	async validateApiKey(ctx){
		if (!ctx.meta || !ctx.meta.headers || !ctx.meta.headers["x-api-key"]){
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Api key not found", 400);
		}
		const apiKeyEncoded = ctx.meta.headers["x-api-key"];
		if (!apiKeyEncoded) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Api key invalid", 400);
		}
		let decodeApiKey = NovaHelpers.EncryptHelper.decryptBase64(apiKeyEncoded).toString();
		decodeApiKey = decodeApiKey.replace(/['"]+/g, '');
		const arr = decodeApiKey.split(".");

		const { route } = ctx.params.params;
		const authLog = {
			client_id: decodeApiKey,
			session: apiKeyEncoded,
			action: route
		};

		const apiKey = await this.apiKeyModel.findOne({id: "authenticate_key"});
		if (!decodeApiKey || !apiKey|| arr.length !=2 || arr[0] !== apiKey.prefix) {
			authLog.message = "Api key invalid";
			await this.authLogLogic.createAuthLog(authLog);
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Api key invalid", 400);
		}
		authLog.message = "Authenticate success";

		const timing = apiKey.timing;
		let filter = {client_id: decodeApiKey,
			createdAt: {$gte: new Date(new Date().getTime() - 1000 * 60),  $lt: new Date()}
		};
		const logs = await this.authLogLogic.getLogs(filter);
		if (logs.length >= timing){
			authLog.message = "too many request";
			await this.authLogLogic.createAuthLog(authLog);
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.TOO_MANY_REQUESTS, "too many request", 429);

		}
		await this.authLogLogic.createAuthLog(authLog);
		// return ResponseHelper.resInfo(ResponseCode.SYS_STATUS_CODE.OK);
		return  this.verifyToken(ctx);
	}

	async genKey(ctx){
		try {
			if (!ctx.meta || !ctx.meta.headers || !ctx.meta.headers["x-api-key"]){
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Api key not found", 400);
			}
			let data;
			const apiKeyEncoded = ctx.meta.headers["x-api-key"];
			if (!apiKeyEncoded) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Api key invalid", 400);
			}
			const clientExisted = await this.authLogLogic.getLogBySession(apiKeyEncoded);
			if (clientExisted && !_.isEmpty(clientExisted)) {
				data = {apiKey: NovaHelpers.EncryptHelper.encryptBase64Object(clientExisted.client_id)};
				return ResponseHelper.resInfo(data);
			}
			const decodeApiKey = NovaHelpers.EncryptHelper.decryptBase64Object(apiKeyEncoded);
			const authenticatePrefixKey = await this.apiKeyModel.findOne({id: "authenticate_key"});

			if (!decodeApiKey || !authenticatePrefixKey || decodeApiKey.publicKey !== authenticatePrefixKey.prefix) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Api key invalid", 400);
			}
			const postFix = uuid.v4().toString();
			const apiKey = authenticatePrefixKey.prefix + "." + postFix;
			const encodeApiKey = NovaHelpers.EncryptHelper.encryptBase64(apiKey);
			data = {apiKey: encodeApiKey};

			const authLog = {
				client_id: apiKey,
				session: apiKeyEncoded,
				action: ctx.span.name
			};
			await this.authLogLogic.createAuthLog(authLog);
			await this.deviceInfoLogic.createDeviceInfo(decodeApiKey);
			return ResponseHelper.resInfo(data);
		} catch (error) {
			// console.log('error', error.message);
			ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, error.message, 400);

		}
	}

	async genToken(ctx){
		try {
			// check userName + password
			const {userName, password} = ctx.params;
			if (userName != 'admin' || password != '123456') {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "userName & password incorrect", 401);
			}

			const token = jwt.sign({
				exp: Math.floor(Date.now() / 1000) + (60 * 60),
				data: {
					accountId: '224324234',
					fullName: "Nguyễn Văn Admin"
				}
			}, process.env.JWT_PORTAL_KEY);
			const data = {
				token
			};
			return ResponseHelper.resInfo(data);
		} catch (error) {
			// console.log('error', error.message);
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST,  error.message, 400);

		}
	}

	async verifyToken(ctx){
		try {
			const authString = ctx.meta.headers["authorization"];
			if (!authString) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized");
			}
			const token = authString.substring(7);
			const decoded = await jwt.verify(token, process.env.JWT_PORTAL_KEY);
			if (!decoded) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
			}
			const {exp, data} = decoded;
			const {accountId, fullName} = data;
			return ResponseHelper.resInfo(data);
		} catch (error) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
		}
	}
}

module.exports = AuthLogic;
