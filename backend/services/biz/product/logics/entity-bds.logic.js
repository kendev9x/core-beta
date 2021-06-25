const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const { TrackingConnector } = require("../connectors");
const BaseLogic = require("./base.logic");

class EntityBdsLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.relationTypeModel = this.models.relationTypeModel;
		this.entityModel = this.models.EntityModel;
		this.trackingConnector = new TrackingConnector(mainProcess);
	}

	/** POST CREATE A PROJECT REAL ESTATE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async createProject(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (FunctionHelper.isEmpty(params)
			|| FunctionHelper.isEmpty(params.project)
			|| FunctionHelper.isEmpty(params.project.name)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		const industryObj = await this.getIndustry("BDS");
		const relationTypes = await this.relationTypeModel.getAll();
		const projectObj = params.project;
		const queryCheckExistName = super.buildFilterCheckExist(projectObj.name, "name", "project");
		const resultCheck = await this.entityModel.findOne(queryCheckExistName);
		if (resultCheck && resultCheck._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.EXIST_NAME, null, langCode);
		}
		projectObj.type = "PROJECT";
		projectObj.createdBy = currentUser.userName;
		if (!projectObj.data || !_.isObject(projectObj.data)) {
			projectObj.data = {
				searchInfo: this.createSearchingObject({name: projectObj.name})
			};
		} else {
			projectObj.data.searchInfo = this.createSearchingObject({name: projectObj.name});
		}
		const projectCreated = await this.entityModel.create(projectObj);
		if (!projectCreated || FunctionHelper.isEmpty(projectCreated._id)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.SAVING_ERROR, null, langCode);
		}
		let {
			groupAreaCreated, areaCreated, rowCreated, blockCreated,
			floorCreated, utilityTypeCreated, utilityCreated, bankCreated, stageAreaCreated
		} = {};
		const relationParams = [];
		if (projectObj.data.category) {
			const relationTypeObj = relationTypes.find((x) => x.name.toUpperCase()
				=== "CATEGORY-PROJECT".toUpperCase());
			const relationCateProjectParam = {
				parent: {
					id: projectObj.data.category.value[langCode],
					name: projectObj.data.category.name[langCode]
				},
				child: [
					{
						id: projectCreated._id,
						name: projectCreated.name[langCode]
					}
				],
				relationType: {
					id: FunctionHelper.isEmpty(relationTypeObj) ? "-1" : relationTypeObj._id,
					name: "CATEGORY-PROJECT"
				},
				industry: {
					id: industryObj._id,
					name: industryObj.name[langCode]
				}
			};
			await this.relationModel.create(relationCateProjectParam);
		}
		if (FunctionHelper.isEmpty(params.stage_area) && _.isArray(params.stage_area) && params.stage_area.length > 0) {
			stageAreaCreated = await this.createSubEntProject(params.stage_area, "STAGE_AREA", currentUser);
			await this.buildRelationParams(params.stage_area, "STAGE_AREA", relationParams, stageAreaCreated);
		}
		if (FunctionHelper.isEmpty(params.group_area) && _.isArray(params.group_area) && params.group_area.length > 0) {
			groupAreaCreated = await this.createSubEntProject(params.group_area, "GROUP_AREA", currentUser);
			await this.buildRelationParams(params.group_area, "GROUP_AREA", relationParams, groupAreaCreated);
		}
		if (FunctionHelper.isEmpty(params.area) && _.isArray(params.area) && params.area.length > 0) {
			areaCreated = await this.createSubEntProject(params.area, "AREA", currentUser);
			await this.buildRelationParams(params.area, "AREA", relationParams, areaCreated);
		}
		if (FunctionHelper.isEmpty(params.row) && _.isArray(params.row) && params.row.length > 0) {
			rowCreated = await this.createSubEntProject(params.row, "ROW", currentUser);
			await this.buildRelationParams(params.row, "ROW", relationParams, rowCreated);
		}
		if (FunctionHelper.isEmpty(params.block) && _.isArray(params.block) && params.block.length > 0) {
			blockCreated = await this.createSubEntProject(params.block, "BLOCK", currentUser);
			await this.buildRelationParams(params.block, "BLOCK", relationParams, blockCreated);
		}
		if (FunctionHelper.isEmpty(params.floor) && _.isArray(params.floor) && params.floor.length > 0) {
			floorCreated = await this.createSubEntProject(params.floor, "FLOOR", currentUser);
			await this.buildRelationParams(params.floor, "FLOOR", relationParams, floorCreated);
		}
		if (FunctionHelper.isEmpty(params.utility_type) && _.isArray(params.utility_type) && params.utility_type.length > 0) {
			utilityTypeCreated = await this.createSubEntProject(params.utility_type, "UTILITY_TYPE", currentUser);
			await this.buildRelationParams(params.utility_type, "UTILITY_TYPE", relationParams, utilityTypeCreated);
		}
		if (FunctionHelper.isEmpty(params.utility) && _.isArray(params.utility) && params.utility.length > 0) {
			utilityCreated = await this.createSubEntProject(params.utility, "UTILITY", currentUser);
			await this.buildRelationParams(params.utility, "UTILITY", relationParams, utilityCreated);
		}
		if (FunctionHelper.isEmpty(params.bank) && _.isArray(params.bank) && params.bank.length > 0) {
			bankCreated = await this.createSubEntProject(params.bank, "BANK", currentUser);
			await this.buildRelationParams(params.bank, "BANK", relationParams, bankCreated);
		}
		if (relationParams.length > 0) {
			let relations = await Promise.all(
				relationParams.map(async (relationParam) => {
					const parentObj = await this.entityModel.findOne({
						code: FunctionHelper.getRegexStringEqualMongo(relationParam.parentCode),
						type: FunctionHelper.getRegexStringEqualMongo(relationParam.parentType),
					});
					const listChild = await this.entityModel.getAll({
						code: {$in: relationParam.childCodes.map((childCode) => FunctionHelper.getRegexStringEqualMongo(childCode))},
						type: FunctionHelper.getRegexStringEqualMongo(relationParam.childType),
					});
					relationParam.parentObj = parentObj;
					relationParam.childObjs = listChild;
					relationParam.relationType = `${relationParam.parentType}-${relationParam.childType}`.toUpperCase();
					return relationParam;
				})
			);
			if (relations.length > 0) {
				relations = relations.map((relation) => {
					const relationTypeObj = relationTypes.find((x) => x.name.toUpperCase()
						=== relation.relationType.toUpperCase());
					return {
						createdBy: currentUser.defaultUser,
						parent: {
							id: relation.parentObj._id,
							name: FunctionHelper.isEmpty(relation.parentObj.name) ? "" : relation.parentObj.name[langCode]
						},
						child: relation.childObjs.map((child) => ({
							id: child._id,
							name:FunctionHelper.isEmpty(child.name) ? "" : child.name[langCode]
						})),
						relationType: {
							id: FunctionHelper.isEmpty(relationTypeObj) ? "-1" : relationTypeObj._id,
							name: relation.relationType
						},
						industry: {
							id: industryObj._id,
							name: industryObj.name[langCode]
						}
					};
				});
			}
			relations = [...new Set(relations.map((o) => JSON.stringify(o)))].map((s) => JSON.parse(s));
			await this.relationModel.createMany(relations);
		}
		/** Tracking user activity */
		const projectLog = await this.funcGetProjectDetail(projectCreated._id);
		this.trackingConnector.logUserActivity(ctx, projectLog).then((r) => r);
		/** Return response */
		return ResponseHelper.resInfo({_id: projectCreated._id});
	}

	/** PUT EDIT A PROJECT REAL ESTATE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async editProject(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (FunctionHelper.isEmpty(params)
			|| FunctionHelper.isEmpty(params.project)
			|| FunctionHelper.isEmpty(params.project.name)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		const industries = await super.getIndustry(ctx);
		const industryObj = FunctionHelper.isEmpty(industries) || !_.isArray(industries) || industries.length < 1 ? {}
			: industries.find((x) => x.code === "BDS");
		const relationTypes = await this.relationTypeModel.getAll();
		const projectObj = params.project;
		projectObj.type = "PROJECT";
		projectObj.updatedBy = currentUser.userName;
		const queryCheckExistName = super.buildFilterCheckExist(projectObj.name, "name", "project");
		const resultCheck = await this.entityModel.getAll(queryCheckExistName);
		if (resultCheck && resultCheck.length > 0 && resultCheck[0]._id.toString() !== projectObj._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.EXIST_NAME, null, langCode);
		}
		if (!projectObj.data || !_.isObject(projectObj.data)) {
			projectObj.data = {
				searchInfo: this.createSearchingObject({name: projectObj.name})
			};
		} else {
			projectObj.data.searchInfo = this.createSearchingObject({name: projectObj.name});
		}
		await this.entityModel.updateOne({ _id: projectObj._id }, projectObj);
		const relationParams = params.relations;
		const listEntUpsert = [];
		if (projectObj.data.category) {
			const relationExist = await this.relationModel.findOne({
				"child.id": projectObj._id,
				"relationType.name": "CATEGORY-PROJECT"
			});
			if (relationExist && relationExist._id) {
				relationExist.parent.id = projectObj.data.category.value[langCode];
				await this.relationModel.updateOne({_id: relationExist._id}, relationExist);
			}
		}
		if (FunctionHelper.isEmpty(params.stage_area) && _.isArray(params.stage_area) && params.stage_area.length > 0) {
			await this.editSubEntProject(params.stage_area, "STAGE_AREA", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.group_area) && _.isArray(params.group_area) && params.group_area.length > 0) {
			await this.editSubEntProject(params.group_area, "GROUP_AREA", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.area) && _.isArray(params.area) && params.area.length > 0) {
			await this.editSubEntProject(params.area, "AREA", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.row) && _.isArray(params.row) && params.row.length > 0) {
			await this.editSubEntProject(params.row, "ROW", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.block) && _.isArray(params.block) && params.block.length > 0) {
			await this.editSubEntProject(params.block, "BLOCK", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.floor) && _.isArray(params.floor) && params.floor.length > 0) {
			await this.editSubEntProject(params.floor, "FLOOR", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.utility_type) &&
			_.isArray(params.utility_type) && params.utility_type.length > 0) {
			await this.editSubEntProject(params.utility_type, "UTILITY_TYPE", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.utility) && _.isArray(params.utility) && params.utility.length > 0) {
			await this.editSubEntProject(params.utility, "UTILITY", currentUser, listEntUpsert);
		}
		if (FunctionHelper.isEmpty(params.bank) && _.isArray(params.bank) && params.bank.length > 0) {
			await this.editSubEntProject(params.bank, "BANK", currentUser, listEntUpsert);
		}
		if (relationParams.length > 0) {
			const listItemFailed = [];
			const processRelation = Promise.all(relationParams.map(async (relation) => {
				if (_.isObject(relation.parent) && !relation.parent.id) {
					const parentEnt = listEntUpsert.find((x) => x.code.toUpperCase() === relation.parent.code.toUpperCase());
					if (parentEnt) {
						relation.parent = {
							id: parentEnt._id,
							name: parentEnt.name[langCode],
							type: parentEnt.type
						};
					}
				}
				if (_.isObject(relation.child) && _.isArray(relation.child.values) && relation.child.values.length > 0) {
					relation.child.values.map((childObj) => {
						if (!childObj.code && childObj.id) {
							return childObj;
						}
						const findEnt = listEntUpsert.find((x) => x.code === childObj.code);
						childObj.id = findEnt && findEnt._id ? findEnt._id : childObj.id;
						delete childObj.code;
						return childObj;
					});
				}
				const relationSet = await this.relationModel.getById(relation.relationId);
				/** Have not relation ==> create a new one */
				if (!relationSet || !relationSet._id) {
					if (!relation.parent.type) {
						listItemFailed.push({
							itemName: relation.parent.name,
							message: ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_TYPE_IN_PARENT_RELATION.MESSAGE[langCode]
						});
						return relation;
					}
					if (!relation.child.type) {
						listItemFailed.push({
							itemName: relation.parent.name,
							message: ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_TYPE_IN_CHILD_RELATION.MESSAGE[langCode]
						});
						return relation;
					}
					const relationTypeCode = `${relation.parent.type.toUpperCase()}-${relation.child.type.toUpperCase()}`;
					const relationTypeObj = relationTypes.find((x) => x.name.toUpperCase()
						=== relationTypeCode);
					const relationAdd = {
						parent: relation.parent,
						child: relation.child.values,
						relationType: {
							id: FunctionHelper.isEmpty(relationTypeObj) ? "-1" : relationTypeObj._id,
							name: relationTypeCode
						},
						industry: {
							id: industryObj._id,
							name: industryObj.name[langCode]
						}
					};
					/** Check if: having item failed ===> not create data */
					if (listItemFailed.length > 0) {
						return relation;
					}
					/** End check */
					await this.relationModel.create(relationAdd);
					return relation;
				}
				/** Update a relation with new parent and child */
				relationSet.parent = relation.parent;
				relationSet.child = relation.child.values;
				relationSet.updatedBy = currentUser.userName;
				await this.relationModel.updateOne({ _id: relation.relationId }, relationSet);
				return relation;
			}));
			await processRelation;
		}
		/** Tracking user activity */
		const projectLog = await this.funcGetProjectDetail(projectObj._id);
		await this.trackingConnector.logUserActivity(ctx, projectLog);
		return ResponseHelper.resInfo(true);
	}

	/** PUT EDIT STATE ACTIVE OF A PROJECT REAL ESTATE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async setIsActive(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params._id || FunctionHelper.isEmpty(params.isActive)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const accountObj = await super.getCurrentUser(ctx);
		params.updatedBy = accountObj.userName;
		const result = await this.entityModel.updateOne({_id: params._id},
			{$set: {isActive: params.isActive, updatedBy: params.updatedBy}});
		/** Tracking user activity */
		await this.trackingConnector.logUserActivity(ctx);
		return super.resolveReturn(result);
	}

	/** PUT EDIT STATE DELETE OF A PROJECT REAL ESTATE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async setIsDelete(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params._id || FunctionHelper.isEmpty(params.isDelete)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const accountObj = await super.getCurrentUser(ctx);
		params.updatedBy = accountObj.userName;
		const result = await this.entityModel.updateOne({_id: params._id},
			{$set: {isDelete: params.isDelete, updatedBy: params.updatedBy}});
		/** Tracking user activity */
		await this.trackingConnector.logUserActivity(ctx);
		return super.resolveReturn(result);
	}

	/** PUT EDIT STATE DELETE OF CHILD ENTITIES OF PROJECT REAL ESTATE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async setIsDeleteEntityProject(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params.ids) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const accountObj = await super.getCurrentUser(ctx);
		const result = Promise.all(
			params.ids.map(async (entId) => {
				await this.setRemoveEntity(entId, ctx, accountObj);
				return entId;
			})
		);
		await result;
		/** Tracking user activity */
		await this.trackingConnector.logUserActivity(ctx);
		return super.resolveReturn(true);
	}

	/** GET LIST PROJECT WITH PAGING INCLUDE APPROVING LOGIC USE FOR WEB PORTAL: PAGE NUMBER, PAGE SIZE
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async listProjectPagingWithApproving(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const lang = RequestHelper.getLanguageCode(ctx);
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		/** Find approval items of this current account login */
		const approvalItems = await this.approvalConnector.getAllApprovalItemsByCurrentUser(ctx, "PROJECT");
		const approvalConfig = await this.approvalConnector.getApprovalMasterConfig(ctx);
		/** Have not approval items ==> just get items was input by current account (editor) */
		params.$or = [{createdBy: currentUser.userName}];
		if (currentUser.roleCodes.findIndex((k) => k === "ADMIN") >= 0) {
			params.$or.push({_id: {$ne: null}});
		}
		if (approvalItems && approvalItems.length > 0) {
			approvalItems.map((approvalItem) => approvalItem.itemId);
			params.approvalItemIds = approvalItems.map((approvalItem) => approvalItem.itemId);
			params.$or.push({_id: {$in: FunctionHelper.convertToMongoId(params.approvalItemIds)}});
		}
		/** End */
		const filter = await this.funcBuildFilterForProject(params, lang, true);
		const sort = {};
		if (_.isEmpty(params)) {
			sort.createdAt = -1;
			const listProject = await this.entityModel.getAll(filter, sort);
			return ResponseHelper.resInfo(listProject);
		}
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const listProject = await this.entityModel.listPaging(filter, sort, params.pageNumber, params.pageSize);
		if (listProject.docs && listProject.docs.length > 0 && approvalItems.length > 0) {
			listProject.docs = listProject.docs.map((projectObj) => {
				projectObj._doc.approval = approvalItems
					.find((approvalObj) => approvalObj.itemId === projectObj._id.toString());
				if (!projectObj._doc.approval || FunctionHelper.isEmpty(projectObj._doc.approval)) {
					return projectObj;
				}
				/** Mapping state text for a state approval */
				projectObj._doc.approval.stateText = approvalConfig.setting.project.levels
					.find((level) => level.status === projectObj._doc.approval.state);
				return projectObj;
			});
		}
		return ResponseHelper.resInfo(listProject);
	}

	/** GET LIST PROJECT WITH PAGING USE FOR MOBILE APP: SKIP, LIMIT
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async listProject(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		const filter = await this.funcBuildFilterForProject(params, langCode);
		let selectField = {};
		if (params.select && _.isArray(params.select)) {
			selectField = super.buildSelectField(params);
		}
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.index = 1;
		sort.createdAt = -1;
		const listProject = await this.entityModel.list(filter, sort, params.skip, params.limit, selectField);
		// Mobile need data image and name for type house in each project row
		if (listProject && listProject.length > 0 && !params.formatData) {
			const result = Promise.all(listProject.map(async (project) => {
				if (project.data.category) {
					project.data.category = await this.processEntityByAttrObj(project.data.category, langCode);
				}
				if (project.data.typeHouse) {
					project.data.typeHouse = await this.processEntityByAttrObj(project.data.typeHouse, langCode);
				}
				return project;
			}));
			await result;
		}
		return super.resolveReturn(listProject);
	}

	/** GET A PROJECT DETAIL WITH APPROVING LOGIC USE FOR WEB PORTAL
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async projectDetailWithApproving(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const projectDetail = await this.funcGetProjectDetail(params.id);
		if (!projectDetail && !projectDetail._id) {
			return ResponseHelper.resInfo({});
		}
		/** Find approval request for this project then set to return data */
		const approvalItem = await this.approvalConnector.getApprovalByItemId(ctx, params.id);
		if (approvalItem && approvalItem._id) {
			const approvalConfig = await this.approvalConnector.getApprovalMasterConfig(ctx);
			projectDetail.approval = approvalItem;
			projectDetail.approval.stateText = approvalConfig.setting.project.levels
				.find((level) => level.status === projectDetail.approval.state);
		}
		return ResponseHelper.resInfo(projectDetail);
	}

	/** GET A PROJECT DETAIL WITH APPROVING LOGIC USE FOR WEB PORTAL
	 * @param ctx: context
	 * @output object: {code, data, message} */
	async projectDetail(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		let projectObj = await this.entityModel.getById(params.id);
		if (FunctionHelper.isEmpty(projectObj)) {
			return ResponseHelper.resInfo({});
		}
		projectObj = await this.processAttributeRef(ctx, projectObj, langCode);
		const relations = [];
		await this.getRelationTree(projectObj._id, relations);
		if (!relations || relations.length < 1) {
			return super.resolveReturn({
				project: projectObj,
				relations: []
			});
		}
		let relationReturn = relations.map((relation) => {
			const typeEntities = relation.type.name.split("-");
			return {
				relationId: relation.relationId,
				parent: {
					id: relation.parent.id,
					name: relation.parent.name,
					type: typeEntities[0]
				},
				child: {
					type: typeEntities[1],
					values: relation.childs
				}
			};
		});
		relationReturn = await this.processRelationEntity(relationReturn, projectObj._id.toString());
		return ResponseHelper.resInfo({
			project: projectObj,
			relations: relationReturn
		});
	}

	// PRIVATE FUNCTIONS USE AT ANOTHER LOGICS
	/** GET DETAIL A PROJECT REAL ESTATE
	 * @param context
	 * @param projectId
	 * @output object: {code, data, message} */
	async funcGetProjectDetail(context, projectId) {
		const projectObj = await this.entityModel.getById(projectId);
		if (FunctionHelper.isEmpty(projectObj)) {
			return {};
		}
		const relations = [];
		await this.getRelationTree(projectObj._id, relations);
		if (!relations || relations.length < 1) {
			return {
				project: projectObj,
				relations: []
			};
		}
		const listIdParent = [];
		const listIdChild = [];
		relations.map((relation) => {
			listIdParent.push(relation.parent.id);
			relation.childs.map((child) => {
				if (child.id) {
					listIdChild.push(child.id);
				}
				return child;
			});
			return relation;
		});
		const listEntParents = await this.funcGetListEntity(context, listIdParent);
		const listEntChild = await this.funcGetListEntity(context, listIdChild);
		const relationReturn = relations.map((relation) => {
			const typeEntities = relation.type.name.split("-");
			return {
				relationId: relation.relationId,
				parent: {
					id: relation.parent.id,
					name: relation.parent.name,
					code: !listEntParents.find((x) => x._id.toString() === relation.parent.id)
						? "" : listEntParents.find((x) => x._id.toString() === relation.parent.id).code,
					type: typeEntities[0]
				},
				child: {
					type: typeEntities[1],
					values: relation.childs.map((child) => {
						child.info = listEntChild.find((x) => x._id.toString() === child.id);
						return child;
					})
				}
			};
		});
		return {
			project: projectObj,
			relations: relationReturn
		};
	}

	async funcBuildFilterForProject(params, langCode, isPortalCall = false) {
		const filter = {
			$and: [{
				isDelete: false,
				type: "PROJECT",
			}]
		};
		if (!params || !_.isObject(params)) {
			return filter;
		}
		if (!isPortalCall) {
			const status = {};
			status[`data.status.value.${langCode}`] = {$eq: 1};
			filter.$and.push(status);
			filter.$and.push({
				isActive: true
			});
		}
		if (params.$or && _.isArray(params.$or) && params.$or.length > 0) {
			filter.$and.push({$or: params.$or});
		}
		if (params.category) {
			const category = {};
			if (_.isArray(params.category) && params.category.length > 0) {
				category[`data.category.value.${langCode}`] = {$in: params.category};
				filter.$and.push(category);
			} else {
				category[`data.category.value.${langCode}`] = params.category;
				filter.$and.push(category);
			}
		}
		if (params.projectCode) {
			const projectCode = {};
			if (_.isArray(params.projectCode) && params.projectCode.length > 0) {
				params.projectCode = params.projectCode.map((x) => {
					x = new RegExp(`^${x}$`, "i");
					return x;
				});
				projectCode[`data.projectCode.value.${langCode}`] = {$in: params.projectCode};
				filter.$and.push(projectCode);
			} else {
				projectCode[`data.projectCode.value.${langCode}`] = params.projectCode;
				filter.$and.push(projectCode);
			}
		}
		if (params.typeHouse) {
			const typeHouse = {};
			if (_.isArray(params.typeHouse) && params.typeHouse.length > 0) {
				typeHouse[`data.typeHouse.value.${langCode}`] = {$in: params.typeHouse};
				filter.$and.push(typeHouse);
			} else {
				typeHouse[`data.typeHouse.value.${langCode}`] = params.typeHouse;
				filter.$and.push(typeHouse);
			}
		}
		if (params.province) {
			const province = {};
			if (_.isArray(params.province) && params.province.length > 0) {
				province[`data.province.value.${langCode}`] = {$in: params.province};
				filter.$and.push(province);
			} else {
				province[`data.province.value.${langCode}`] = params.province;
				filter.$and.push(province);
			}
		}
		if (params.investor) {
			const investor = {};
			if (_.isArray(params.investor) && params.investor.length > 0) {
				investor[`data.investor.value.${langCode}`] = {$in: params.investor};
				filter.$and.push(investor);
			} else {
				investor[`data.investor.value.${langCode}`] = params.investor;
				filter.$and.push(investor);
			}
		}
		if (params.openStatus) {
			const openStatus = {};
			if (_.isArray(params.openStatus) && params.openStatus.length > 0) {
				params.openStatus = params.openStatus.map((x) => {
					x = new RegExp(x, "i");
					return x;
				});
				openStatus[`data.openStatus.value.${langCode}`] = {$in: params.openStatus};
				filter.$and.push(openStatus);
			} else {
				openStatus[`data.openStatus.value.${langCode}`] = params.openStatus;
				filter.$and.push(openStatus);
			}
		}
		if (params.isHot) {
			const isHot = {};
			isHot[`data.isHot.value.${langCode}`] = params.isHot;
			filter.$and.push(isHot);
		}
		if (params.keyword) {
			const nameSearch = {};
			nameSearch[`name.${langCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`data.searchInfo.name.${langCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			filter.$and.push({$or: [nameSearch, searchInfo]});
		}
		return filter;
	}
}

module.exports = EntityBdsLogic;