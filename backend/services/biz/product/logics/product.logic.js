const ResponseCode = require("../../../../defined/response-code");
const {APP_SETTING} = require("../defined");
const { RequestHelper, FunctionHelper, ResponseHelper } = require("../../../../libs/helpers");
const BaseLogic = require("./base.logic");
const ProductFilterLogic = require("./product-filter.logic");
const SqlDriver = require("mssql");
const SqlDb = require("../dbHandler/sqlDb");

class ProductLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.industryModel = this.models.IndustryModel;
		this.productModel = this.models.ProductModel;
		this.productTemplateModel = this.models.ProductTemplateModel;
		this.productFilterLogic = new ProductFilterLogic(mainProcess);
		this.sqlDB = new SqlDb(mainProcess);
	}

	/** Logic for Web Portal: Get list product with paging
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const { filter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, true, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.productModel.listPaging(filter, sort, params.pageNumber, params.pageSize);
		if (result && result.docs.length > 0) {
			const templateIds = result.docs.map((x) => x.templateId);
			const listTemplate = await this.productTemplateModel.getAll({_id: {$in: templateIds}});
			result.docs.map((product) => {
				product.template = listTemplate.find((x) => x._id.toString() === product.templateId);
				return product;
			});
		}
		return ResponseHelper.resInfo(result);
	}

	/** Logic for Mobile App: Get list product showcase
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listShowcase(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const { filter, skuFilter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, false, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.productModel.listShowcase(filter, skuFilter, sort, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** Logic for both Mobile App and Web Portal: Get product detail
	 * @param context
	 * @output object: {code, data, message}
	 */
	async getDetailById(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const result = await this.productModel.getById(FunctionHelper.convertToMongoId(params.id));
		return ResponseHelper.resInfo(result);
	}

	/** SQL TESTING */
	async getListDataSql(context) {
		try {
			const dbConnection = await this.sqlDB.createConnection();
			/** JUST USE FOR TESTING NOT USE THIS FOR PUBLISH */
			const result = await dbConnection.request().query("Select * from sample");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return ResponseHelper.resInfo(result.recordset);
			}
			return ResponseHelper.resInfo(result);
		} catch (e) {
			return ResponseHelper.resErr(506, "Processing Failed", 500);
		}
	}

	async getListDataSQLBySP(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.status) {
				return ResponseHelper.resErr(400, "Bad request", 400);
			}
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("status", SqlDriver.Int, params.status)
				.execute("GetDataSP");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return ResponseHelper.resInfo(result.recordset);
			}
			return ResponseHelper.resInfo(result);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}
}

module.exports = ProductLogic;
