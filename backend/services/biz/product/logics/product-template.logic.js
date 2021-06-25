const ResCode = require("../../../../defined/response-code");
const { RequestHelper, FunctionHelper, ResponseHelper } = require("../../../../libs/helpers");
const { TrackingConnector } = require("../connectors");
const { ProductTemplateDto } = require("../io/transfer");
const BaseLogic = require("./base.logic");

class ProductTemplateLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.productTemplateModel = this.models.ProductTemplateModel;
		this.industryModel = this.models.IndustryModel;
		this.trackingConnector = new TrackingConnector(mainProcess);
	}

	/** GET LIST PRODUCT TEMPLATE PAGING
	 * @param context
	 * @output object: {code, data, message} */
	async listPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const query = {
			filter: { isDelete: false },
		};
		if (params.isActive) {
			query.filter.isActive = params.isActive;
		}
		if (params.keyword) {
			const languageCode = RequestHelper.getLanguageCode(context);
			const nameSearch = {};
			nameSearch[`name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`searchInfo.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			query.filter.$or = [nameSearch, searchInfo];
		}
		if (params.industry) {
			query.filter.industry = params.industry;
		}
		if (params.ids && Array.isArray(params.ids) && params.ids.length > 0) {
			query.filter._id = {$in: params.ids};
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = params.sortType;
		}
		sort.createdAt = -1;
		const result = await this.productTemplateModel
			.listPaging(query.filter, sort, params.pageNumber, params.pageSize);
		if (result && result.docs.length > 0) {
			const listIndustryById = await this.industryModel
				.getAll({ _id: { $in: result.docs.map((x) => x.industry) }});
			result.docs = result.docs.map((proTemplate) => {
				proTemplate.industryObj = listIndustryById
					.find((ins) => ins._id.toString() === proTemplate.industry);
				return proTemplate;
			});
		}
		return ResponseHelper.resInfo(result);
	}

	/** GET ALL PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async listAll(context) {
		const params = context.params.query;
		const query = {
			filter: { isDelete: false },
		};
		if (params.isActive) {
			query.filter.isActive = params.isActive;
		}
		if (params.keyword) {
			const languageCode = RequestHelper.getLanguageCode(context);
			const nameSearch = {};
			nameSearch[`name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`searchInfo.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			query.filter.$or = [nameSearch, searchInfo];
		}
		if (params.ids && Array.isArray(params.ids) && params.ids.length > 0) {
			query.filter._id = {$in: params.ids};
		}
		if (params.industry) {
			query.filter.industry = params.industry;
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = params.sortType;
		}
		sort.createdAt = -1;
		let result = await this.productTemplateModel.getAll(query.filter);
		if (result && result.length > 0) {
			const listIndustryId = result.map((x) => x.industry);
			const listIndustry = await this.industryModel
				.getAll({ _id: { $in: listIndustryId}});
			result = result.map((proTemplate) => {
				proTemplate.industryObj = listIndustry
					.find((ins) => ins._id.toString() === proTemplate.industry);
				return proTemplate;
			});
		}
		return ResponseHelper.resInfo(result);
	}

	/** GET DETAIL PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async detail(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		let result = await this.productTemplateModel.findOne({_id: params.id });
		if (result && result._id) {
			result = new ProductTemplateDto(super.getLanguageCode(context)).mappingObj(result);
		}
		return ResponseHelper.resInfo(result);
	}

	async detailWithoutTranslate(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		let result = await this.productTemplateModel.findOne({_id: params.id });
		if (result && result._id) {
			result = new ProductTemplateDto(super.getLanguageCode(context)).mappingCustom(result);
		}
		return ResponseHelper.resInfo(result);
	}

	async detailByIdAndRevision(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params.id || !params.templateRev) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		let result = await this.productTemplateModel.findOne({_id: params.id });
		if (result && result._id) {
			result = new ProductTemplateDto(super.getLanguageCode(context))
				.mappingExactRevisionField(result, params.templateRev);
		}
		return ResponseHelper.resInfo(result);
	}

	/** POST CREATE A PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async create(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params.name || (typeof params.name !== "object" && Object.keys(params.name).length < 1)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_NAME);
		}
		if (!params.industry) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_INDUSTRY);
		}
		const industryObj = await this.industryModel.findOne({_id: params.industry});
		if (!industryObj) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_INDUSTRY);
		}
		if (!params.fields || params.fields.length < 1) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_FIELDS);
		}
		const queryCheckExistName = await super.buildFilterCheckExist(params.name, "name");
		const resultCheck = await this.productTemplateModel.getAll(queryCheckExistName);
		if (resultCheck && resultCheck.length > 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.EXIST_NAME);
		}
		const checkFields = [];
		params.revisions = [
			{
				_id: this.novaHelper.generateRandomNumber(6),
				fields: params.fields.map((field, index) => {
					if (!field.label || Object.keys(field.label).length < 1) {
						checkFields.push(`${index} is missing label name`);
					}
					if (!field.type) {
						checkFields.push(`${field.name} is missing type`);
					}
					if (field.type.toUpperCase() === "PLENT" && !field.entType) {
						checkFields.push(`${field.name} type PLENT is missing entType`);
					}
					field.name = `a${field.index ? field.index : (index + 1)}`;
					field.type = field.type.toUpperCase();
					field.entType = field.entType ? field.entType.toUpperCase() : field.entType;
					return field;
				}),
				isDelete: false
			}
		];
		if (checkFields.length > 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.DATA_FIELDS_INVALID, checkFields);
		}
		params.searchInfo = this.createSearchingObject({name: params.name});
		const accountObj = RequestHelper.getCurrentAccount(context);
		params.createBy = accountObj.userName;
		const productTemplateAdd = await this.productTemplateModel.create(params);
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context, productTemplateAdd).then((r) => r);
		return ResponseHelper.resInfo(productTemplateAdd);
	}

	/** PUT UPDATE A PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async update(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		if (!params.name || (typeof params.name !== "object" && Object.keys(params.name).length < 1)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_NAME);
		}
		if (!params.industry) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_INDUSTRY);
		}
		const industryObj = await this.industryModel.findOne({_id: params.industry});
		if (!industryObj) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_INDUSTRY);
		}
		if (!params.fields || params.fields.length < 1) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_FIELDS);
		}
		const productTemplateObj = await this.productTemplateModel.findOne({ _id: FunctionHelper.convertToMongoId(params._id) });
		if (!productTemplateObj) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND);
		}
		const queryCheckExistName = await super.buildFilterCheckExist(params.name, "name");
		const resultCheck = await this.productTemplateModel.getAll(queryCheckExistName);
		if (resultCheck && resultCheck.length > 0 && resultCheck[0]._id.toString() !== params._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.EXIST_NAME);
		}
		const checkFields = [];
		params.fields.map((field, index) => {
			if (!field.label || Object.keys(field.label).length < 1) {
				checkFields.push(`${index} is missing label name`);
			}
			if (!field.type) {
				checkFields.push(`${field.name} is missing type`);
			}
			if (field.type.toUpperCase() === "PLENT" && !field.entType) {
				checkFields.push(`${field.name} type PLENT is missing entType`);
			}
			field.name = `a${field.index ? field.index : (index + 1)}`;
			field.type = field.type.toUpperCase();
			field.entType = field.entType ? field.entType.toUpperCase() : field.entType;
			return field;
		});
		if (checkFields.length > 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.DATA_FIELDS_INVALID, checkFields);
		}
		productTemplateObj.name = params.name;
		productTemplateObj.industry = params.industry;
		productTemplateObj.shortDesc = params.shortDesc;
		productTemplateObj.description = params.description;
		productTemplateObj.updateBy = params.updateBy;
		productTemplateObj.isActive = params.isActive;
		if (!productTemplateObj.revisions) {
			productTemplateObj.revisions = [];
		}
		productTemplateObj.revisions.map((revision) => {
			revision.isDelete = true;
			return revision;
		});
		productTemplateObj.revisions.push({
			_id: this.novaHelper.generateRandomNumber(6),
			fields: params.fields,
			isDelete: false
		});
		params.searchInfo = this.createSearchingObject({name: params.name});
		const accountObj = RequestHelper.getCurrentAccount(context);
		params.updateBy = accountObj.userName;
		const result = await this.productTemplateModel.update(productTemplateObj);
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context, productTemplateObj).then((r) => r);
		return ResponseHelper.resInfo(result);
	}

	/** POST UPDATE IS_ACTIVE A PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async setIsActive(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params || !params._id || params.isActive === null || params.isActive === undefined) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		const result = await this.productTemplateModel.setIsActive(params._id, params.isActive);
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context).then((r) => r);
		return ResponseHelper.resInfo(result);
	}

	/** POST UPDATE IS_DELETE A PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async setIsDelete(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params || !params._id || params.isDelete === null || params.isDelete === undefined) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		const result = await this.productTemplateModel.setIsDelete(params._id, params.isDelete);
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context).then((r) => r);
		return ResponseHelper.resInfo(result);
	}

	/** POST UPDATE IS_DELETE FOR A REVISION OF A PRODUCT TEMPLATE
	 * @param context
	 * @output object: {code, data, message} */
	async setIsDeleteForRevision(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params || !params._id || !params.revId || params.isDelete === null || params.isDelete === undefined) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM);
		}
		const result = await this.productTemplateModel.setIsDeleteRevision(params._id, params.revId, params.isDelete);
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context).then((r) => r);
		return ResponseHelper.resInfo(result);
	}
}

module.exports = ProductTemplateLogic;