const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const BaseLogic = require("./base.logic");

class EntityTypeLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.entityTypeModel = this.models.EntityTypeModel;
	}

	/** GET ALL ENTITY TYPE
	 * @param context
	 * @output object: {code, data, message} */
	async getAll(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const filter = {
			isDelete: false
		};
		if (params.code) {
			filter.code = FunctionHelper.getRegexStringEqualMongo(params.code);
		}
		if (params.keyword) {
			filter.$or = [
				{
					name: FunctionHelper.getRegexStringContainWithMongo(params.name)
				}
			];
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.entityTypeModel.getAll(filter, sort);
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST ENTITY TYPE HAVE PAGING: PAGE NUMBER, PAGE SIZE
	 * @param context
	 * @output object: {code, data, message} */
	async getListPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const filter = {
			isDelete: false
		};
		if (params.code) {
			filter.code = FunctionHelper.getRegexStringEqualMongo(params.code);
		}
		if (params.keyword) {
			filter.$or = [
				{
					name: FunctionHelper.getRegexStringContainWithMongo(params.name)
				}
			];
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.entityTypeModel.listPaging(filter, sort, params.pageNumber, params.pageSize);
		return ResponseHelper.resInfo(result);
	}

	/** GET A ENTITY TYPE BY ID
	 * @param context
	 * @output object: {code, data, message} */
	async getById(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const result = await this.entityTypeModel.getById(params.id);
		return ResponseHelper.resInfo(result);
	}

	/** GET A ENTITY TYPE BY CODE
	 * @param context
	 * @output object: {code, data, message} */
	async getByCode(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params.code) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const result = await this.entityTypeModel.findOne({
			code: FunctionHelper.getRegexStringEqualMongo(params.code)
		});
		return ResponseHelper.resInfo(result);
	}

	/** Private func use for another logics */
	async funcGetById(context, id) {
		if (!id) {
			return {};
		}
		return await this.entityTypeModel.getById(id);
	}

	async funcGetByCode(context, code) {
		if (!code) {
			return {};
		}
		return await this.entityTypeModel.findOne({
			code: FunctionHelper.getRegexStringEqualMongo(code)
		});
	}
}

module.exports = EntityTypeLogic;