const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const BaseLogic = require("./base.logic");

class RelationLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.relatonModel = this.models.RelationModel;
		this.relationTypeModel = this.models.RelationTypeModel;
		this.entityModel = this.models.EntityModel;
	}

	/** POST CREATE A RELATION
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async createRelation(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		const account = RequestHelper.getCurrentAccount(ctx);
		if (FunctionHelper.isEmpty(params)
			|| FunctionHelper.isEmpty(params.parentId)
			|| FunctionHelper.isEmpty(params.childIds)
			|| FunctionHelper.isEmpty(params.relationType)
			|| FunctionHelper.isEmpty(params.industry)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		/** Check correct data entity of parent */
		const parentEntity = await this.funcGetEntityById(ctx, params.parentId);
		if (FunctionHelper.isEmpty(parentEntity) || parentEntity.isActive === false || parentEntity.isDelete === true) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.PARENT_NOT_FOUND, null, langCode);
		}
		/** Check correct data entity of list child */
		if (params.childIds.length < 1) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.CHILD_ITEMS_EMPTY, null, langCode);
		}
		const checkListChildEntityNotFound = [];
		const listChildEntity = [];
		await Promise.all(params.childIds.map(async (childId) => {
			const childEntity = await this.funcGetEntityById(ctx, childId);
			if (FunctionHelper.isEmpty(childEntity) || childEntity.isActive === false || parentEntity.isDelete === true) {
				checkListChildEntityNotFound.push({childId});
				return childId;
			}
			listChildEntity.push(childEntity);
			return childId;
		}));
		if (checkListChildEntityNotFound.length > 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.CHILD_ITEM_NOT_FOUND,
				checkListChildEntityNotFound, langCode);
		}
		/** Check relation type */
		const relationType = await this.funcGetRelationTypeById(ctx, relationType);
		if (FunctionHelper.isEmpty(relationType) || relationType.isDelete === true) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		/** Check industry */
		const industryObj = this.getIndustry(params.industry);
		if (FunctionHelper.isEmpty(industryObj) || industryObj.isActive === false || industryObj.isDelete === true) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.INDUSTRY_NOT_FOUND, null, langCode);
		}
		/** Build relation object */
		const relationObj = {
			createdBy: account.userName,
			updatedBy: account.userName,
			parent: {
				id: parentEntity._id.toString(),
				name: parentEntity.name[langCode]
			},
			child: listChildEntity.map((child) => {
				return {
					id: child._id.toString(),
					name: child.name[langCode]
				};
			}),
			relationType: {
				id: relationType._id.toString(),
				name: relationType.name
			},
			industry: {
				id: industryObj._id.toString(),
				name: industryObj.name[langCode]
			}
		};
		const result = await this.relationModel.create(relationObj);
		return ResponseHelper.resInfo(result);
	}

	/** PUT EDIT A RELATION
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async editRelation(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		const account = RequestHelper.getCurrentAccount(ctx);
		if (FunctionHelper.isEmpty(params)
			|| FunctionHelper.isEmpty(params._id)
			|| FunctionHelper.isEmpty(params.parentId)
			|| FunctionHelper.isEmpty(params.childIds)
			|| FunctionHelper.isEmpty(params.relationType)
			|| FunctionHelper.isEmpty(params.industry)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		/** Check correct data entity of parent */
		const parentEntity = await this.funcGetEntityById(ctx, params.parentId);
		if (FunctionHelper.isEmpty(parentEntity) || parentEntity.isActive === false || parentEntity.isDelete === true) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.PARENT_NOT_FOUND, null, langCode);
		}
		/** Check correct data entity of list child */
		if (params.childIds.length < 1) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.CHILD_ITEMS_EMPTY, null, langCode);
		}
		const checkListChildEntityNotFound = [];
		const listChildEntity = [];
		await Promise.all(params.childIds.map(async (childId) => {
			const childEntity = await this.funcGetEntityById(ctx, childId);
			if (FunctionHelper.isEmpty(childEntity) || childEntity.isActive === false || parentEntity.isDelete === true) {
				checkListChildEntityNotFound.push({childId});
				return childId;
			}
			listChildEntity.push(childEntity);
			return childId;
		}));
		if (checkListChildEntityNotFound.length > 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.CHILD_ITEM_NOT_FOUND,
				checkListChildEntityNotFound, langCode);
		}
		/** Check relation type */
		const relationType = await this.funcGetRelationTypeById(ctx, relationType);
		if (FunctionHelper.isEmpty(relationType) || relationType.isDelete === true) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		/** Check industry */
		const industryObj = this.getIndustry(params.industry);
		if (FunctionHelper.isEmpty(industryObj) || industryObj.isActive === false || industryObj.isDelete === true) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.INDUSTRY_NOT_FOUND, null, langCode);
		}
		/** Check item is editing */
		const relationObj = await this.relatonModel.getById(params._id);
		if (FunctionHelper.isEmpty(relationObj)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		const relationEdit = {
			_id: relationObj._id,
			updatedBy: account.userName,
			parent: {
				id: parentEntity._id.toString(),
				name: parentEntity.name[langCode]
			},
			child: listChildEntity.map((child) => {
				return {
					id: child._id.toString(),
					name: child.name[langCode]
				};
			}),
			relationType: {
				id: relationType._id.toString(),
				name: relationType.name
			},
			industry: {
				id: industryObj._id.toString(),
				name: industryObj.name[langCode]
			}
		};
		const result = await this.relationModel.update(relationEdit);
		return ResponseHelper.resInfo(result);
	}

	/** PUT REMOVE A RELATION
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async setIsDelete(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (FunctionHelper.isEmpty(params)
			|| FunctionHelper.isEmpty(params._id)
			|| FunctionHelper.isEmpty(params.isDelete)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		/** Check item is editing */
		const relationObj = await this.relatonModel.getById(params._id);
		if (FunctionHelper.isEmpty(relationObj)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		const result = await this.relationModel.setIsDelete(params._id, params.isDelete);
		return ResponseHelper.resInfo(result);
	}

	/** GET ALL RELATION WITH FILTER
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async getAll(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		const filter = await this.buildFilter(params, langCode);
		const sort = {};
		if (params._id) {
			const relationObj = await this.relationModel.getById(params._id);
			const result = {detail: relationObj};
			return ResponseHelper.resInfo(result);
		}
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const data = await this.relationModel.getAll(filter, sort);
		return ResponseHelper.resInfo(data);
	}

	/** GET ALL RELATION WITH FILTER AND PAGING: PAGE NUMBER, PAGE SIZE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async getListPaging(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		const filter = await this.buildFilter(params, langCode);
		const sort = {};
		if (params._id) {
			const relationObj = await this.relationModel.getById(params._id);
			const result = {detail: relationObj};
			return ResponseHelper.resInfo(result);
		}
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const data = await this.relationModel.listPaging(filter, sort, params.pageNumber, params.pageSize);
		return ResponseHelper.resInfo(data);
	}

	/** GET DATA RELATION CHILD VALUES
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async getListChild(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		const filter = await this.buildFilter(params, langCode);
		const data = await this.relationModel.findOne(filter);
		if (data && data.child.length > 0) {
			return ResponseHelper.resInfo(data.child);
		}
		return ResponseHelper.resInfo([]);
	}

	// PRIVATE FUNC
	async buildFilter(params) {
		const filter = {
			isDelete: false
		};
		if (!params) {
			return filter;
		}
		if (params.industry) {
			filter["industry.id"] = params.industry;
		}
		if (params.parentId) {
			filter["parent.id"] = params.parentId;
		}
		if (params.childId) {
			filter["child.id"] = params.childId;
		}
		if (params.childIds) {
			filter["child.id"] = {$in: params.childIds};
		}
		if (params.typeId) {
			filter["relationType.id"] = params.typeId;
		}
		if (params.type) {
			filter["relationType.name"] = params.type.toUpperCase();
		}
		return filter;
	}
}

module.exports = RelationLogic;