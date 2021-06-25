const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { NovaHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");
const AuthLogLogic = require("./auth-log.logic");
const DeviceInfoLogic = require("./device-info.logic");
const uuid = require("uuid");
const jwt = require('jsonwebtoken');
const { ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const UserConnector = require("../connectors/user.connector");
const CustomerConnector = require("../connectors/customer.connector");
const NidConnector = require("../../../../connectors/nid/nid.connector");
const PortalTokenConnector = require("../connectors/portal-token.connector");

class AuthLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.apiKeyModel = this.models.ApiKeyModel;
		this.otpModel = this.models.OtpModel;
		this.authLogLogic = new AuthLogLogic(mainProcess);
		this.deviceInfoLogic = new DeviceInfoLogic(mainProcess);
		this.userConnector = new UserConnector(mainProcess);
		this.customerConnector = new CustomerConnector(mainProcess);
		this.portalTokenConnector = new PortalTokenConnector(mainProcess);
		this.nidConnector = new NidConnector(mainProcess);
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
		decodeApiKey = decodeApiKey.replace(/['"]+/g, "");
		const arr = decodeApiKey.split(".");

		const { route } = ctx.params.params;
		const authLog = {
			client_id: decodeApiKey,
			session: apiKeyEncoded,
			action: route
		};

		const apiKey = await this.apiKeyModel.findOne({id: "authenticate_key"});
		if (!decodeApiKey || !apiKey || arr.length !== 2 || arr[0] !== apiKey.prefix) {
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
		return ResponseHelper.resInfo(ResponseCode.SYS_STATUS_CODE.OK);
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
			const user = await this.userConnector.findUserByUserAndPass(ctx, {userName, password});
			if (_.isEmpty(user)) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "userName & password incorrect", 401);
			}

			const token = jwt.sign({
				exp: Math.floor(Date.now() / 1000) + (60 * 60),
				data: {
					accountId: user._id.toString(),
					fullName: user.fullName
				}
			}, process.env.JWT_PORTAL_KEY);
			const data = {
				token
			};
			const resultToken = await this.nidConnector.getToken(0, userName, password);
			const portalTokens = {
				accountId: user._id.toString(),
				userName,
				tokenV1: resultToken.token,
				tokenV2: token
			};
			await this.portalTokenConnector.createPortalToken(ctx, portalTokens);
			return ResponseHelper.resInfo(data);
		} catch (error) {
			// console.log('error', error.message);
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST,  error.message, 400);

		}
	}

	async verifyTokenMobile(ctx){
		try {
			const authString = ctx.meta.headers["authorization"];
			if (!authString) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized");
			}
			const token = authString.substring(7);
			const decoded = await jwt.verify(token, process.env.JWT_MOBILE_KEY);
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

	async verifyTokenPortal(ctx){
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
			const {exp, data = {}} = decoded;
			const {accountId, fullName} = data;
			// get tokenV1 by accountId & tokenv2 from portal_tokens
			const tokenV1 = await this.portalTokenConnector.getPortalTokenV1ByTokenV2(ctx, token);
			data.tokenV1 = tokenV1;
			return ResponseHelper.resInfo(data);
		} catch (error) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
		}
	}

	async authorize(ctx) {
		try {
			const { route, accountId, actionName } = ctx.params.params;
			// const actions = ["v3.ProductBiz.portalGetIndustry"];
			// It check the `auth` property in action schema.
			const actions = await this.userConnector.getActionsByUserId(ctx, accountId);
			if (!actions.includes(actionName)) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.FORBIDDEN, "Forbidden", 403);
			}
			return ResponseHelper.resInfo(true);
		} catch (error) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
		}
	}

	/** TODO: FUNCTION ERROR - NOT PASS PHONE PARAM ALSO RUN */
	async genOtp(ctx) {
		try {
			const { phone, status } = ctx.params;
			if (!phone || !status) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Missing params", 400);
			} else if (!NovaHelpers.FunctionHelper.isPhoneNumber(phone)) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Phone is invalid", 400);
			}
			const dateNow = new Date();
			dateNow.setMinutes(dateNow.getMinutes() + 2);
			const otp = await this.otpModel.create({
				phone,
				otp: FunctionHelper.randomStringNumber(6),
				status,
				timeExpired: new Date(dateNow)
			});
			return ResponseHelper.resInfo(true);
		} catch (error) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
		}
	}

	async verifyOtp(ctx) {
		try {
			const { phone, otp } = ctx.params;
			const otpInDB = await this.otpModel.findOne({ phone, otp });
			if (_.isEmpty(otpInDB)) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
			}
			if ((Date.now() - otpInDB.timeExpired.getTime()) > 12000) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
			}

			const profile = await this.customerConnector.findProfileByPhone(ctx, phone);
			const token = jwt.sign({
				exp: Math.floor(Date.now() / 1000) + (60 * 60),
				data: {
					accountId: profile.accountId,
					fullName: profile.fullName
				}
			}, process.env.JWT_MOBILE_KEY);
			const data = {
				token
			};
			return ResponseHelper.resInfo(data);
		} catch (error) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
		}
	}

	async authorizeMobile(ctx) {
		try {
			const { route, accountId, actionName } = ctx.params.params;
			/** TODO: SET CONFIGURATION FOR ACTIONS AT DB */
			const actionsMobile = ["v3.AccountBiz.mobileCustomerFindByPhone"];
			if (!actionsMobile.includes(actionName)) {
				return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
			}
			return ResponseHelper.resInfo(true);
		} catch (error) {
			return ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.UNAUTHORIZED, "Unauthorized", 401);
		}
	}
}

module.exports = AuthLogic;
