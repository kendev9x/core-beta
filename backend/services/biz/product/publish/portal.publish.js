const {IndustryLogic, ProductLogic} = require("../logics");

/**
 Portal Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger, configs, dbMain, models
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.industryLogic = new IndustryLogic(mainProcess);
		this.productLogic = new ProductLogic(mainProcess);
	}

	/** Portal publish action: Get all industry
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	getAll(ctx) {
		return this.industryLogic.getAllIndustry(ctx);
	}

	/** Portal publish action: Get list product paging
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	getListProductPaging(ctx) {
		return this.productLogic.listPaging(ctx);
	}
}

module.exports = PortalPublish;
