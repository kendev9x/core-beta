const {NovaHelpers} = require("../../../../libs");
const {CustomerLogic} = require("../logics");
const {Response} = require("../io");

/**
 Portal Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.customerLogic = new CustomerLogic(mainProcess);
	}

	/** Portal Publish: Get all user activities -- just use for testing
	 * @param ctx context
	 * @output Promise<T> {code, data, message}
	 */
	getListCustomer(ctx) {
		return this.customerLogic.getList()
			.then((result) => {
				const {data} = result;
				if (!data || data.length < 1) {
					return result;
				}
				result.data = NovaHelpers.MapperHelper.mapListObj(data, Response.PortalCustomerResponse);
				return result;
			})
			.catch((err) => err);
	}
}

module.exports = PortalPublish;
