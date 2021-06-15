const {NovaHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {CashWalletLogic, BonusWalletLogic, WalletLogic} = require("../logics");
/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.cashWalletLogic = new CashWalletLogic(mainProcess);
		this.bonusWalletLogic = new BonusWalletLogic(mainProcess);
		this.walletLogic = new WalletLogic(mainProcess);

	}

	/** Mobile Publish: Get Customer By Phone
	 * @param ctx context
	 * @output Promise<T> {code, data, message}
	 * */
	async uploadBamCashs(ctx) {
		return this.cashWalletLogic.uploadBamCashs(ctx);
	}
	async uploadBamBonus(ctx) {
		return this.bonusWalletLogic.uploadBamBonus(ctx);
	}

	async getWalletByCustomerId(ctx) {
		return this.walletLogic.getWalletByCustomerId(ctx);
	}
	async getWalletById(ctx) {
		return this.walletLogic.getWalletById(ctx);
	}
	async getListWallet(ctx){
		return this.walletLogic.getListWallet(ctx);
	}
	async getTransactionByWalletId(ctx) {
		return this.walletLogic.getTransactionByWalletId(ctx);
	}
	async getTransactionByCustomerId(ctx) {
		return this.walletLogic.getTransactionByCustomerId(ctx);
	}
}

module.exports = PortalPublish;
