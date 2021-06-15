const {NovaHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {CashWalletLogic} = require("../logics");
// return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);

/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.cashWalletLogic = new CashWalletLogic(mainProcess);
	}
}

module.exports = MobilePublish;
