const {NovaHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {BamLogic, BamBonusLogic} = require("../logics");
/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.bamLogic = new BamLogic(mainProcess);
		this.bamBonusLogic = new BamBonusLogic(mainProcess);
	}

	/** Mobile Publish: Get Customer By Phone
	 * @param ctx context
	 * @output Promise<T> {code, data, message}
	 * */
	async uploadBamCashs(ctx) {
		return this.bamLogic.uploadBamCashs(ctx);
	}
	async uploadBamBonus(ctx) {
		return this.bamBonusLogic.uploadBamBonus(ctx);
	}

	async getWalletByCustomerId(ctx) {
		return this.bamBonusLogic.getWalletByCustomerId(ctx);
	}
}

module.exports = PortalPublish;
