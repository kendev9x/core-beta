const _ = require("lodash");
const { NovaHelpers } = require("../../../../../libs");

class BaseMobileRoutes {
	constructor(config, broker) {
		this.config = config;
		this.broker = broker;
		this.logger = broker.logger;
	}

	/** BASE FUNCTIONS PRE-PROCESS REQUEST
	 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
	 */
	onBeforeCallBase(ctx, route, req, res) {
		ctx.meta.headers = req.headers;
		this.trackingRequest(ctx, route, req, res, this.logger);
	}

	/** BASE FUNCTIONS PRE-PROCESS RESPONSE
	 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
	 */
	onAfterCallBase(ctx, route, req, res, data) {
		this.trackingResponse(ctx, route, req, res, data, this.logger);
		/** Checking and mapping code logic to status response */
		if (data.statusCode) {
			res.statusCode = data.statusCode;
			delete data.statusCode;
		}
		return data;
	}

	/** BASE FUNCTIONS HANDLE ERRORS FOR EACH ROUTE
	 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
	 */
	onErrorBase(req, res, err) {
		this.logger.error(err);
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		if (err && _.isObject(err.message)) {
			res.statusCode = err.message.code;
			res.end(JSON.stringify({code: err.message.code }));
		} else {
			res.statusCode = err.code;
			res.end(JSON.stringify({
				code: err.code || 501,
				message: err.message || "Global error, Please contact support team"
			}));
		}
	}

	/** TRACKING */
	trackingRequest(ctx, route, req, res, logger) {
		try {
			const reqObj = {
				nodeId: ctx.nodeID,
				url: req.originalUrl,
				headers: req.headers,
				action: req && req.$action ? req.$action.name : "",
				params: req && req.$params ? req.$params : {}
			};
			ctx.meta.userAgent = req.headers["user-agent"];
			logger.info(`REQUEST: REQID: ${ctx.id}, ${JSON.stringify(reqObj)}`);
		} catch (e) {
			console.log(e);
		}
	}

	trackingResponse(ctx, route, req, res, data, logger) {
		try {
			/** Tan add tracking response */
			logger.info(`RESPONSE: REQID: ${ctx.id}, ${JSON.stringify(data)}`);
			/** Call log user activities */
			const userAct = {
				isFull: true,
				username: ctx.meta.userName || "ADMIN",
				service: req.$action.service.name,
				action: req.$action.name,
				url: req.originalUrl,
				method: req.method,
				params: req.$params,
				data
			};
			this.broker.emit("tracking.event.logUserAct", userAct);
			/** Return */
			return data;
		} catch (e) {
			console.log(e);
		}
	}

	/** TODO IMPLEMENT VALIDATION ON BASE ROUTES OF MOBILE ENDPOINTS */
	validReq(req, res) {}

	checkNoSqlInjection(req, res) {
		/** Check valid params input */
		const paramCheck = NovaHelpers.RequestHelper.sanitizeParam(req);
		if (!paramCheck) {
			/** Not valid throw error 400 Bad request */
			res.end(JSON.stringify({
				code: 400,
				message: "Bad request"
			}));
		}
	}
}

module.exports = BaseMobileRoutes;
