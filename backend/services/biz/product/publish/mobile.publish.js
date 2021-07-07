const {CoreHelpers} = require("../../../../libs");
const {IndustryLogic, ProductLogic} = require("../logics");
const {Response} = require("../io");

/**
 MobilePublish: Processing logic industry for mobile app
 @param {mainProcess} props: logger, configs, dbMain, models
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.industryLogic = new IndustryLogic(mainProcess);
		this.productLogic = new ProductLogic(mainProcess);
	}

	/** Mobile publish action: Get all industry use for mobile app
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
						.mapListObj(data, Response.MobileIndustryResponse);
					res(resInfo);
				})
				.catch((err) => {
					rej(err);
				});
		});
	}

	/** Mobile publish action: Get list product showcase for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	productListShowcase(ctx) {
		return new Promise((res, rej) => {
			this.productLogic.listShowcase(ctx)
				.then((resInfo) => {
					const {data} = resInfo;
					if (!data) {
						return res(resInfo);
					}
					resInfo.data = CoreHelpers.MapperHelper.mapListObj(data, Response.MobileProductShowcaseResponse);
					res(resInfo);
				})
				.catch((err) => {
					rej(err);
				});
		});
	}

	/** Mobile publish action: Get list product showcase for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	productDetail(ctx) {
		return new Promise((res, rej) => {
			this.productLogic.getDetailById(ctx)
				.then((resInfo) => {
					const {data} = resInfo;
					if (!data) {
						return res(resInfo);
					}
					resInfo.data = CoreHelpers.MapperHelper.mapObj(data, Response.MobileProductShowcaseResponse);
					res(resInfo);
				})
				.catch((err) => {
					rej(err);
				});
		});
	}

	/** SQL TESTING */
	getListDataSql(ctx) {
		return new Promise((res, rej) => {
			this.productLogic.getListDataSql(ctx)
				.then((resInfo) => {
					const {data} = resInfo;
					if (!data) {
						return res(resInfo);
					}
					res(resInfo);
				}).catch((err) => {
					rej(err);
				});
		});
	}

	getListDataSqlBySP(ctx) {
		return new Promise((res, rej) => {
			this.productLogic.getListDataSQLBySP(ctx)
				.then((resInfo) => {
					const {data} = resInfo;
					if (!data) {
						return res(resInfo);
					}
					res(resInfo);
				}).catch((err) => {
					rej(err);
				});
		});
	}
}

module.exports = MobilePublish;
