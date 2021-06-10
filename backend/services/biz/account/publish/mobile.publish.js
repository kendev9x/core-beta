const {NovaHelpers} = require("../../../../libs");
const {CustomerLogic} = require("../logics");
const {Response} = require("../io");

/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.customerLogic = new CustomerLogic(mainProcess);
	}

	/** Mobile Publish: Customer register */
	register(ctx) {
		return this.customerLogic.createCustomer(ctx);
	}

	/** Mobile Publish: Get Customer By Phone
	 * @param ctx context
	 * @output Promise<T> {code, data, message}
	 * */
	getByPhone(ctx) {
		const params = ctx.params;
		return this.customerLogic.getByPhone(params.phone);
	}
}

module.exports = MobilePublish;
