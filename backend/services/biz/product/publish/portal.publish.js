const {CoreHelpers} = require("../../../../libs");
const {IndustryLogic, ProductLogic, ProductTemplateLogic} = require("../logics");
const {Response} = require("../io");

/**
 Portal Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger, configs, dbMain, models
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.industryLogic = new IndustryLogic(mainProcess);
		this.productLogic = new ProductLogic(mainProcess);
		this.productTemplateLogic = new ProductTemplateLogic(mainProcess);
	}

	/** Portal publish action: Get all industry
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	industryGetAll(ctx) {
		return new Promise((res, rej) => {
			this.industryLogic.getAll(ctx)
				.then((resInfo) => {
					const {data} = resInfo;
					if (!data) {
						return res(resInfo);
					}
					resInfo.data = CoreHelpers.MapperHelper
						.mapListObj(data, Response.PortalIndustryResponse);
					res(resInfo);
				})
				.catch((err) => {
					rej(err);
				});
		});
	}

	/** Portal publish action: Get list product paging
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	productGetListPaging(ctx) {
		return this.productLogic.listPaging(ctx);
	}

	/** Portal publish action: Get list product template paging
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	productTemplateGetListPaging(ctx) {
		return this.productTemplateLogic.listPaging(ctx);
	}

	/** Portal publish action: Get list product template detail
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	productTemplateGetDetail(ctx) {
		return this.productTemplateLogic.detail(ctx);
	}
}

module.exports = PortalPublish;
