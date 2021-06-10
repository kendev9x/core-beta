const Service = require("moleculer").Service;
const { NovaHelpers } = require("../../../libs");

/**
 * Base GW use for all GW service
 * @param {broker} required
 * @param {serviceOptions} require object name string
 */
class BaseGW extends Service {
	constructor(broker, serviceOptions) {
		super(broker);
		this.serviceOptions = serviceOptions;
		this.config = require(`../../../configs/${process.env.ENVIROMENT.toLowerCase()}.config.js`);
	}

	/** BASE FUNCTIONS HANDLE GLOBAL ERRORS FOR EACH ROUTE
	 * THIS IS CAN OVERWRITE FROM CHILD SERVICES
	 */
	onGlobalError(req, res, err) {
		this.logger.error(err);
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.statusCode = err.code;
		res.end(JSON.stringify({
			code: err.code || 501,
			message: err.type || "Global error, Please contact support team"
		}));
	}

	/** BASE FUNCTIONS RUN SERVICES */
	serviceCreated() {
		this.logger.info(`${this.serviceOptions.name} GW created.`);
	}

	serviceStarted() {
		this.logger.info(`${this.serviceOptions.name} GW started.`);
	}

	serviceStopped() {
		this.logger.info(`${this.serviceOptions.name} GW stopped.`);
	}

	/** Get config of service via config name
	 * @param configName string
	 * @output object config */
	getConfig(configName) {
		const environment = process.env.ENVIROMENT;
		return require(`../../../configs/${environment.toLowerCase()}/${configName}.config.js`);
	}

	/** Send response to client */
	resEnd(res, code, message, data) {
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		res.statusCode = code;
		res.end(JSON.stringify({
			code: code || 501,
			message: message || "Error, Please contact support team",
			data
		}));
	}
}

module.exports = BaseGW;
