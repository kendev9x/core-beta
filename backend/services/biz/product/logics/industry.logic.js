const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const BaseLogic = require("./base.logic");

class IndustryLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.industryModel = this.models.IndustryModel;
	}

	/** GET ALL INDUSTRIES
	 * @param context
	 * @output object: {code, data, message} */
	async getAll(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const query = {
			filter: { isDelete: false }
		};
		if (params.keyword) {
			const languageCode = RequestHelper.getLanguageCode(context);
			const nameSearch = {};
			nameSearch[`name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`searchInfo.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const codeSearch = {
				code: FunctionHelper.getRegexStringEqualMongo(params.keyword)
			};
			query.filter.$or = [nameSearch, searchInfo, codeSearch];
		}
		if (params.industryTypeId) {
			query.filter["type._id"] = params.industryTypeId;
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = params.sortType;
		}
		const result = await this.industryModel.getAll(query.filter, sort);
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST INDUSTRIES
	 * @param context
	 * @output object: {code, data, message} */
	async list(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const query = {
			filter: { isDelete: false }
		};
		if (params.keyword) {
			const languageCode = RequestHelper.getLanguageCode(context);
			const nameSearch = {};
			nameSearch[`name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`searchInfo.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const codeSearch = {
				code: FunctionHelper.getRegexStringEqualMongo(params.keyword)
			};
			query.filter.$or = [nameSearch, searchInfo, codeSearch];
		}
		if (params.isActive) {
			query.filter.isActive = params.isActive;
		} else {
			query.filter.isActive = true;
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = params.sortType;
		}
		let result = await this.industryModel.list(query.filter, sort, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST INDUSTRIES WITH PAGING
	 * @param context
	 * @output object: {code, data, message} */
	async listPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const query = {
			filter: { isDelete: false }
		};
		if (params.keyword) {
			const languageCode = RequestHelper.getLanguageCode(context);
			const nameSearch = {};
			nameSearch[`name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`searchInfo.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const codeSearch = {
				code: FunctionHelper.getRegexStringEqualMongo(params.keyword)
			};
			query.filter.$or = [nameSearch, searchInfo, codeSearch];
		}
		if (params.industryTypeId) {
			query.filter["type._id"] = params.industryTypeId;
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = params.sortType;
		}
		const result = await this.industryModel.listPaging(query.filter, sort,
			params.pageNumber, params.pageSize);
		return ResponseHelper.resInfo(result);
	}

	/** GET DETAIL A INDUSTRY BY ID
	 * @param context
	 * @output object: {code, data, message} */
	async detail(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		let result = await this.industryModel.getById(params.id);
		return ResponseHelper.resInfo(result);
	}

	/** GET DETAIL A INDUSTRY BY CODE
	 * @param context
	 * @output object: {code, data, message} */
	async detailByCode(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.code) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		let result = await this.industryModel.getByCode(params.code);
		return ResponseHelper.resInfo(result);
	}

	/** POST SET IS ACTIVE A INDUSTRY
	 * @param context
	 * @output object: {code, data, message} */
	async setIsActive(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params._id || !params.isActive) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM,null, langCode);
		}
		const result = await this.industryModel.setIsActive(params._id, params.isActive);
		return ResponseHelper.resInfo(result);
	}

	/** POST SET IS DELETE A INDUSTRY
	 * @param context
	 * @output object: {code, data, message} */
	async setIsDelete(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params._id || !params.isDelete) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM,null, langCode);
		}
		const result = await this.industryModel.setIsDelete(params._id, params.isDelete);
		return ResponseHelper.resInfo(result);
	}
}

module.exports = IndustryLogic;
