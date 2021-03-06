const {CoreHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {AuthLogic} = require("../logics");
/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.authLogic = new AuthLogic(mainProcess);
	}

	/** Mobile Publish: Get Customer By Phone
	 * @param ctx context
	 * @output Promise<T> {code, data, message}
	 * */
	async genToken(ctx) {
		return this.authLogic.genToken(ctx);
	}

	async verifyToken(ctx) {
		return this.authLogic.verifyTokenPortal(ctx);
	}

	async authorize(ctx) {
		return this.authLogic.authorize(ctx);
	}

	async authenticate(ctx){
		// console.log("call authenticate success", ctx.meta.headers["x-api-key"]);
		return await this.authLogic.validateApiKey(ctx);
	}
}

module.exports = PortalPublish;
