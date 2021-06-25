const {NovaHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {CashWalletLogic} = require("../logics");
const {TicketLogic} = require("../logics");
// return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);

/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.cashWalletLogic = new CashWalletLogic(mainProcess);
		this.ticketLogic = new TicketLogic(mainProcess);
	}
	async createBamTicket(ctx) {
		return this.ticketLogic.createBamTicket(ctx);
	}
}

module.exports = MobilePublish;
