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

	async authenticate(ctx){
		// console.log("call authenticate success", ctx.meta.headers["x-api-key"]);
		return await this.apiKey.validateApiKey(ctx);
	}

	async verifyToken(ctx) {
		return await this.apiKey.verifyTokenMobile(ctx);
	}

	async authorize(ctx){
		return this.apiKey.authorizeMobile(ctx);
	}

	async genOtp(ctx) {
		return this.apiKey.genOtp(ctx);
	}

	async verifyOtp(ctx) {
		return this.apiKey.verifyOtp(ctx);
	}
}

module.exports = MobilePublish;
