const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const { TrackingConnector } = require("../connectors");
const { EntityDto } = require("../io/transfer");
const BaseLogic = require("./base.logic");

class EntityLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.entityModel = this.models.EntityModel;
		this.relationModel = this.models.RelationModel;
		this.relationTypeModel = this.models.RelationTypeModel;
		this.industryModel = this.models.IndustryModel;
		this.entityDto = new EntityDto(mainProcess);
		this.trackingConnector = new TrackingConnector(mainProcess);
	}

	/** POST CREATE A ENTITY
	 * @param context
	 * @output object: {code, data, message} */
	async createEntity(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(params) || FunctionHelper.isEmpty(params.type) || FunctionHelper.isEmpty(params.name)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		/** Check exist entity with: isCheckExist is true and checkExistFields is array string */
		if (params.isCheckExist && params.checkExistFields
			&& params.checkExistFields.length > 0) {
			const resultCheck = [];
			await Promise.all(params.checkExistFields.map(async (fieldName) => {
				const valueOfField = params[fieldName].value || params[fieldName];
				const queryCheckExist = super.buildFilterCheckExist(valueOfField,
					fieldName, params.type);
				const resultCheckData = await this.entityModel.getAll(queryCheckExist);
				if (resultCheckData && resultCheckData.length > 0) {
					const messageObj = valueOfField[langCode];
					resultCheck.push(messageObj);
				}
			}));
			if (resultCheck.length > 0) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.EXISTED, resultCheck, langCode);
			}
		}
		const currentUser = RequestHelper.getCurrentAccount(context);
		params.createdBy = currentUser.userName;
		const entityCreated = await this.entityModel.create(params);
		/** If have relations were set so will create relation */
		const checkErrors = [];
		if (params.relations && _.isArray(params.relations) && params.industry) {
			await Promise.all(params.relations.map(async (relation) => {
				if (!relation.type || !relation.parent || !relation.child || !_.isArray(relation.child)) {
					checkErrors.push(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_RELATION);
				}
				if (!params.industry) {
					checkErrors.push(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_INDUSTRY);
				}
				const industryObj = await super.getIndustry(params.industry);
				if (!industryObj) {
					checkErrors.push(ResCode.BIZ_STATUS_CODE.PRODUCT.INDUSTRY_NOT_FOUND);
				}
				/** Check validation, not correct ==> next item */
				if (checkErrors.length > 0) {
					return relation;
				}
				/** End check */
				const relationType = await super.getRelationType(relation.type);
				relation.child.map((child) => {
					if (child.code === entityCreated.code) {
						child.id = entityCreated._id;
						child.name = entityCreated.name[langCode];
					}
					return child;
				});
				relation.child = relation.child.filter((x) => x.id);
				if (relation.parent.code && relation.parent.code === entityCreated.code) {
					relation.parent = {
						id: entityCreated._id,
						name: entityCreated.name.vi || entityCreated.name
					};
				}
				if (relation.parent.id) {
					const relationExisted = await this.relationModel.findOne({"parent.id": relation.parent.id});
					if (relationExisted._id) {
						relationExisted.child = [...relationExisted.child, relation.child];
						await this.relationModel.update(relationExisted);
					} else {
						const relationObj = {
							createdBy: currentUser.userName,
							parent: relation.parent,
							child: relation.child,
							relationType: {
								id: relationType._id,
								name: relationType.name
							},
							industry: {
								id: industryObj._id,
								name: industryObj.name[langCode]
							}
						};
						await this.relationModel.create(relationObj);
					}
				}
				return relation;
			}));
			if (checkErrors.length > 0) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, checkErrors, langCode);
			}
		}
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context, entityCreated).then((r) => r);
		/** Return response */
		const result = !!(entityCreated && entityCreated._id);
		return ResponseHelper.resInfo(result);
	}

	/** PUT EDIT A ENTITY
	 * @param context
	 * @output object: {code, data, message} */
	async editEntity(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(params) || FunctionHelper.isEmpty(params._id) || FunctionHelper.isEmpty(params.data)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		/** Check exist entity with: isCheckExist is true and checkExistFields is array string */
		if (params.isCheckExist && params.checkExistFields && params.checkExistFields.length > 0) {
			const resultCheck = [];
			await Promise.all(params.checkExistFields.map(async (fieldName) => {
				const valueOfField = params.data[fieldName].value || params.data[fieldName];
				const queryCheckExist = super.buildFilterCheckExist(valueOfField,
					fieldName, params.data.type);
				const resultCheckData = await this.entityModel.getAll(queryCheckExist);
				const resultOfOtherEnt = resultCheckData.filter(((x) => x._id.toString() !== params._id));
				if (resultCheckData && resultCheckData.length > 0
					&& resultOfOtherEnt.length > 0) {
					const messageObj = valueOfField[langCode];
					resultCheck.push(messageObj);
				}
			}));
			if (resultCheck.length > 0) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.EXISTED, resultCheck, langCode);
			}
		}
		const currentUser = await RequestHelper.getCurrentAccount(context);
		params.data.updatedBy = currentUser.userName;
		const entityEdited = await this.entityModel.updateOne(
			{_id: params._id},
			{$set: params.data}
		);
		/** If have relations were set so will create relation */
		const checkErrors = [];
		if (params.data.relations && _.isArray(params.data.relations) && params.data.industry) {
			await Promise.all(params.data.relations.map(async (relation) => {
				if (!relation.type || !relation.parent || !relation.child || !_.isArray(relation.child)) {
					checkErrors.push(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_RELATION);
				}
				if (!params.data.industry) {
					checkErrors.push(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_INDUSTRY);
				}
				const industryObj = await super.getIndustry(params.data.industry);
				if (!industryObj) {
					checkErrors.push(ResCode.BIZ_STATUS_CODE.PRODUCT.INDUSTRY_NOT_FOUND);
				}
				/** Check validation, not correct ==> next item */
				if (checkErrors.length > 0) {
					return relation;
				}
				const relationType = await super.getRelationType(relation.type);
				relation.child.map((child) => {
					if (child.code === params.data.code) {
						child.id = params.data._id;
						child.name = params.data.name[langCode];
					}
					return child;
				});
				relation.child = relation.child.filter((x) => x.id);
				if (relation.parent.code && relation.parent.code === params.data.code) {
					relation.parent = {
						id: params.data._id,
						name: params.data.name[langCode] || params.data.name
					};
				}
				if (relation._id) {
					const relationExisted = await this.relationModel.getById(relation._id);
					if (relationExisted._id) {
						relationExisted.child = relation.child;
						relationExisted.parent = relation.parent;
						relationExisted.relationType = {
							id: relationType._id,
							name: relationType.name
						};
						relationExisted.industry = {
							id: industryObj._id,
							name: industryObj.name[langCode]
						};
						await this.relationModel.update(relationExisted);
					}
				} else {
					const relationObj = {
						createdBy: currentUser.userName,
						parent: relation.parent,
						child: relation.child,
						relationType: {
							id: relationType._id,
							name: relationType.name
						},
						industry: {
							id: industryObj._id,
							name: industryObj.name[langCode]
						}
					};
					await this.relationModel.create(relationObj);
				}
				return relation;
			}));
			if (checkErrors.length > 0) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, checkErrors, langCode);
			}
		}
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context, params.data).then((r) => r);
		/** Return response */
		return ResponseHelper.resInfo(entityEdited.nModified > 0);
	}

	/** DELETE A ENTITY
	 * @param context
	 * @output object: {code, data, message} */
	async removeEntity(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(params.ids) && FunctionHelper.isEmpty(params._id)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(context);
		params.updatedBy = currentUser.userName;
		let result = false;
		/** Remove with only a entity by id -- old logic using this */
		if (params._id) {
			const entityRemoved = await this.setRemoveEntity(params._id, currentUser);
			result = entityRemoved.nModified > 0;
		}
		/** Remove list entity by list id -- add more for case remove many without affected old logic */
		else if (params.ids.length > 0) {
			await Promise.all(params.ids.map(async (id) => {
				await this.setRemoveEntity(params._id, currentUser);
				return id;
			}));
			result = true;
		}
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context).then((r) => r);
		/** Return response */
		ResponseHelper.resInfo(result);
	}

	/** GET A ENTITY OR A LIST ENTITY HAVE PAGING: PAGE NUMBER, PAGE SIZE
	 * @param context
	 * @output object: {code, data, message} */
	async getEntityOrListPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		const filter = await super.buildFilter(params, langCode, true);
		if (!params || FunctionHelper.isEmpty(params) || !params.type) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		if (params.isActive) {
			filter.isActive = params.isActive;
		}
		const sort = {};
		let select = {};
		if (params.select) {
			select = super.buildSelectField(params);
		}
		if (params._id) {
			const entityObj = await this.entityModel.getById(params._id, false, select);
			if (!entityObj || _.isEmpty(entityObj)) {
				return ResponseHelper.resInfo({});
			}
			return ResponseHelper.resInfo({detail: entityObj});
		}
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.entityModel.listPaging(filter, sort, params.pageNumber, params.pageSize, select);
		return ResponseHelper.resInfo(result);
	}

	/** GET A ENTITY OR A LIST ENTITY HAVE PAGING: SKIP, LIMIT
	 * @param context
	 * @output object: {code, data, message} */
	async getEntityOrList(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params.type) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const filter = await this.buildFilter(params, langCode, false);
		const sort = {};
		let select = {};
		if (params.select && _.isArray(params.select)) {
			select = super.buildSelectField(params);
		}
		if (params._id) {
			const entityObj = await this.entityModel.getById(params._id, false, select);
			if (!entityObj || _.isEmpty(entityObj)) {
				return ResponseHelper.resInfo({});
			}
			const result = {detail: entityObj};
			return ResponseHelper.resInfo(result);
		}
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		const result = await this.entityModel.list(filter, sort, params.skip, params.limit, select);
		return ResponseHelper.resInfo(result);
	}

	/** GET A LIST ENTITY REFERENCE TO A ACCOUNT
	 * @description Get entity ref to account: params require: accountId
	 * @description Ex: Use for case: get information branch of account is logging for redemption voucher
	 * @param context
	 * @output object: {code, data, message} */
	async getEntityRefAccount(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(params.valueFilter) || FunctionHelper.isEmpty(params.keyNameFilter)
			|| FunctionHelper.isEmpty(params.entityType) || FunctionHelper.isEmpty(params.relationType)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const filterObj = {
			type: FunctionHelper.getRegexStringEqualMongo(params.entityType),
			isDelete: false,
			isActive: true
		};
		filterObj[`data.${params.keyNameFilter}.value.${langCode}`] = params.valueFilter;
		/** Get entity staff by filter */
		const entityStaffObj = await this.entityModel.findOne(filterObj);
		if (FunctionHelper.isEmpty(entityStaffObj) || FunctionHelper.isEmpty(entityStaffObj._id)) {
			return ResponseHelper.resInfo({});
		}
		/** Get relation of this staff entity */
		const entityId = entityStaffObj._id.toString();
		const relationFilter = {
			"relationType.name": FunctionHelper.getRegexStringEqualMongo(params.relationType),
			"child.id": entityId,
			isDelete: false
		};
		const relation = await this.relationModel.findOne(relationFilter);
		entityStaffObj.relation = FunctionHelper.isEmpty(relation) ? {} : relation;
		return ResponseHelper.resInfo(entityStaffObj);
	}

	/** GET LIST ENTITY BY LIST ID
	 * @param context
	 * @output object: {code, data, message} */
	async getEntitiesByIds(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(params) || FunctionHelper.isEmpty(params.ids)
			|| !_.isArray(params.ids) || params.ids.length < 1) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const filter = {
			_id: {$in: FunctionHelper.convertToMongoId(params.ids)},
			isActive: true,
			isDelete: false
		};
		let data = [];
		if (params.pageNumber && params.pageSize) {
			data = await this.entityModel.listPaging(filter, params.sort, params.pageNumber, params.pageSize);
		} else {
			data = await this.entityModel.getAll(filter);
		}
		if (params.formatData) {
			data = await this.entityDto.planeData(context, data, langCode);
		}
		return ResponseHelper.resInfo(data);
	}

	/** PUT SET IS ACTIVE A ENTITY
	 * @param context
	 * @output object: {code, data, message} */
	async setIsActive(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.isActive || !params._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const accountObj = RequestHelper.getCurrentAccount(context);
		params.updatedBy = accountObj.userName;
		const result = await this.entityModel.updateOne({_id: params._id},
			{$set: {isActive: params.isActive, updatedBy: params.updatedBy}});
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context).then((r) => r);
		return ResponseHelper.resInfo(result.nModified > 0);
	}

	/** PUT SET IS DELETE A ENTITY
	 * @param context
	 * @output object: {code, data, message} */
	async setIsDelete(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.isDelete || !params._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const accountObj = RequestHelper.getCurrentAccount(context);
		params.updatedBy = accountObj.userName;
		const result = await this.entityModel.updateOne({_id: params._id},
			{$set: {isActive: params.isActive, updatedBy: params.updatedBy}});
		/** Tracking data log */
		this.trackingConnector.logUserActivity(context).then((r) => r);
		return ResponseHelper.resInfo(result.nModified > 0);
	}
}

module.exports = EntityLogic;
