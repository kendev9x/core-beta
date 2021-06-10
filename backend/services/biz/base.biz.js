const Service = require("moleculer").Service;

/**
 * Base service use for all GW
 * @param {broker} required
 * @param {serviceOptions} require object name string
 */
class BaseBisService extends Service {
	constructor(broker, serviceOptions) {
		super(broker);
		this.serviceOptions = serviceOptions;
	}

	/** BASE FUNCTIONS RUN SERVICES */
	serviceCreated() {
		this.logger.info(`${this.serviceOptions.name} Service Biz created.`);
	}

	serviceStarted() {
		this.logger.info(`${this.serviceOptions.name} Service Biz started.`);
	}

	serviceStopped() {
		this.logger.info(`${this.serviceOptions.name} Service Biz stopped.`);
	}

	/** GET CONFIGS VIA ENVIRONMENT */
	getConfig(configName) {
		const environment = process.env.ENVIROMENT;
		return require(`../../configs/${environment.toLowerCase()}/${configName}.config.js`);
	}
}

module.exports = BaseBisService;
