const {NovaHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {AuthLogic} = require("../logics");
// return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);

/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.apiKey = new AuthLogic(mainProcess);
	}

	/** Mobile Publish: Get Customer By Phone
	 * @param ctx context
	 * @output Promise<T> {code, data, message}
	 * */
	async genKey(ctx) {
		return this.apiKey.genKey(ctx);
	}

	async internalAuthenticate(ctx){
		// console.log("call authenticate success", ctx.meta.headers["x-api-key"]);
		return await this.apiKey.validateApiKey(ctx);
	}

	async internalAuthorization(ctx){
		console.log("call authorization success", ctx.meta.headers["x-api-key"]);
		//if else guest || customer
	}
}

module.exports = MobilePublish;
