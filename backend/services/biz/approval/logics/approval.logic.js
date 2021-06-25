const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const { APP_SETTING } = require("../defined");
const { ProductConnector, TrackingConnector, ArticleConnector } = require("../connectors");
const BaseLogic = require("./base.logic");

class ApprovalLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.approvalModel = this.models.ApprovalModel;
		this.approvalConfigModel = this.models.ApprovalConfigModel;
		this.trackingConnector = new TrackingConnector(mainProcess);
		this.productConnector = new ProductConnector(mainProcess);
		this.articleConnector = new ArticleConnector(mainProcess);
	}

	/** GET ALL APPROVAL ITEMS FOR A ACCOUNT
	 * @description
	 * @param ctx
	 * @output object: {code, data, message} */
	async getAllApprovalByAccount(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params.itemType) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		if (!currentUser || !currentUser.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.USER_NOT_FOUND, null, langCode);
		}
		/** Set filter approval object */
		const filterObj = {
			itemType: params.itemType,
			$or: [
				{
					"editor.userId": currentUser.userId
				}
			]
		};
		/** Filter by parent data if approval items type are: PRODUCT, ARTICLE ... */
		if (params.parentIds) {
			filterObj["data.id"] = {$in: params.parentIds};
		}
		const approverKeysResult = await this.approvalModel.aggregate([
			{$project: {o: {$objectToArray: "$approvers"}}},
			{$unwind: "$o"},
			{$group: {_id: null, data: {$addToSet: "$o.k"}}}
		]);
		const approverKeys = _.first(approverKeysResult).data;
		/** Build filter dynamic key level with current user */
		approverKeys.map((approverKey) => {
			if (approverKey && !_.isEmpty(approverKey)) {
				const levelApprove = {};
				levelApprove[`approvers.${approverKey}.userId`] = {$in: [currentUser.userId]};
				filterObj.$or.push(levelApprove);
			}
			return approverKey;
		});
		/** Get all approval items of current user */
		const result = await this.approvalModel.getAll(filterObj, {createdAt: -1});
		return ResponseHelper.resInfo(result);
	}

	/** GET ALL APPROVAL ITEMS FOR EDIOTR
	 * @description
	 * @param ctx
	 * @output object: {code, data, message} */
	async getAllApprovalItemsByUserEditor(ctx) {
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!currentUser || !currentUser.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.USER_NOT_FOUND, null, langCode);
		}
		const filterObj = {
			"editor.userId": currentUser.userId
		};
		const result = await this.approvalModel.getAll(filterObj, {});
		return ResponseHelper.resInfo(result);
	}

	/** GET ALL APPROVAL ITEMS FOR CURRENT USER WAS SET IN APPROVERS
	 * @description
	 * @param ctx
	 * @output object: {code, data, message} */
	async getAllApprovalItemsByApprovalPersonAndType(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params.itemType) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.MISSING_ITEM_TYPE, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		if (!currentUser || !currentUser.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.USER_NOT_FOUND, null, langCode);
		}
		const filterObj = {
			$where: () => {
				if (!this.approvers || this.approvers.keys().length < 1) {
					return false;
				}
				this.approvers.keys().forEach((field) => this.approvers[field] === [currentUser.userId]
					&& this.itemType === params.itemType.toUpperCase());
			},
		};
		const result = await this.approvalModel.getAll(filterObj, {});
		return ResponseHelper.resInfo(result);
	}

	/** GET A APPROVAL BY ID
	 * @description
	 * @param ctx
	 * @output object: {code, data, message} */
	async getApprovalByItemId(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params.itemId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		if (!currentUser || !currentUser.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.USER_NOT_FOUND, null, langCode);
		}
		const filterObj = {
			itemId: params.itemId
		};
		const result = await this.approvalModel.findOne(filterObj, {}, {createdAt: -1});
		return ResponseHelper.resInfo(result);
	}

	/** Create approval request for content after editor input data as: product, article for a project
	 * @param ctx require: itemId string, itemType string, user object, industry, mainId as projectId
	 * @output object: {code, data, message}*/
	async createApprovalForFirstLevel(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || FunctionHelper.isEmpty(params.itemId) || FunctionHelper.isEmpty(params.itemType)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		/** Check existed */
		const approvalExisted = await this.approvalModel.findOne({
			itemId: params.itemId
		});
		if (approvalExisted && approvalExisted.state !== APP_SETTING.APPROVAL_STATE.REJECT) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.ITEM_WAS_SEND_APPROVE, null, langCode);
		}
		if (!params.industry) {
			params.industry = APP_SETTING.INDUSTRY_CODE_DEFAULT;
		}
		if (!params.mainId && (params.itemType.toUpperCase() === APP_SETTING.ITEM_TYPE.PROJECT
			|| params.itemType.toUpperCase() === APP_SETTING.ITEM_TYPE.ARTICLE)) {
			params.mainId = params.itemId;
		} else if (!params.mainId && params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.PROJECT) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.MISSING_PARAM_MAIN_ID, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		if (!currentUser || !currentUser.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.USER_NOT_FOUND, null, langCode);
		}
		const currentUserAction = {
			userId: currentUser.userId,
			fullName: currentUser.fullName,
			email: currentUser.userName
		};
		/** Get approval config of item by industry and mainId as: id project ... */
		let approvalConfig = {};
		if (params.itemType.toUpperCase() === APP_SETTING.ITEM_TYPE.PROJECT
			|| params.itemType.toUpperCase() === APP_SETTING.ITEM_TYPE.ARTICLE) {
			approvalConfig = await this.approvalConfigModel.findOne({
				industry: params.industry.toUpperCase(),
				type: "MASTER"
			});
		} else {
			approvalConfig = await this.approvalConfigModel.findOne({
				industry: params.industry.toUpperCase(),
				"data.id": params.mainId
			});
		}
		if (!approvalConfig || _.isEmpty(approvalConfig)
			|| !approvalConfig._id || !approvalConfig.setting
			|| _.isEmpty(approvalConfig.setting)
			|| (!approvalConfig.setting[params.itemType.toLowerCase()]
				&& params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.PROJECT)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.APPROVAL_CONFIG_NOT_FOUND, null, langCode);
		}
		/** Get setting of approval config */
		const approvalSettingTypeObj = approvalConfig.setting[params.itemType.toLowerCase()];
		/** Get first level in setting. First level as first approval after editor input data */
		const approvalLevelObj = _.first(approvalSettingTypeObj.levels);
		const approvalPersonLevel = approvalSettingTypeObj[approvalLevelObj.level];
		const approvalObj = {
			industry: params.industry || "BDS",
			itemId: params.itemId.toString(),
			itemName: params.itemName.toString(),
			itemType: params.itemType.toUpperCase(),
			state: APP_SETTING.APPROVAL_STATE.INITIAL, // WHEN APPROVAL ITEM CREATE FIRST STATE IS INITIAL
			editor: currentUserAction,
			userProcess: currentUserAction,
			approvers: {},
			comments: []
		};
		/** Set person approval by config level */
		if (params.approver) {
			/** If request select approval person so set approver = approval person */
			approvalObj.approvers[approvalLevelObj.level] = params.approver;
		} else {
			/** If request not set approval so get first approval person from config */
			approvalObj.approvers[approvalLevelObj.level] = approvalPersonLevel;
		}
		/** For case approval Product and Article if not set setting approval config
		 *  will get approve person  of project for approving */
		if ((!approvalObj.approvers[approvalLevelObj.level]
			|| _.isEmpty(approvalObj.approvers[approvalLevelObj.level]))
			&& params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.PROJECT
			&& params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.ARTICLE) {
			/** Get approval of project was approved */
			const parentApprovalData = await this.approvalModel.findOne({
				itemId: params.mainId,
				itemType: params.mainType || APP_SETTING.ITEM_TYPE.PROJECT,
				state: {$eq: APP_SETTING.APPROVAL_STATE.PUSBLISH}
			});
			/** So missing data person approval. Dev please check project approval was approved correct data or not */
			if (!parentApprovalData || !parentApprovalData.approvers[approvalLevelObj.level]) {
				return ResponseHelper.resFailed(
					ResCode.BIZ_STATUS_CODE.APPROVAL.APPROVER_CONFIG_LEVEL_NOT_FOUND, null, langCode);
			}
			/** Set person approval to person approval was approved for project */
			approvalObj.approvers[approvalLevelObj.level] = parentApprovalData.approvers[approvalLevelObj.level];
		}
		if (FunctionHelper.isEmpty(approvalObj.approvers[approvalLevelObj.level])) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.APPROVER_NOT_FOUND, null, langCode);
		}
		if (params.comment && !FunctionHelper.isEmpty(params.comment)) {
			const commentObj = {
				userId: currentUser.userId,
				fullName: currentUser.fullName,
				email: currentUser.userName,
				note: params.comment
			};
			approvalObj.comments.push(commentObj);
		}
		const approvalCreated = await this.approvalModel.create(approvalObj);
		if (approvalCreated && approvalCreated._id) {
			/** Tracking activities result */
			this.trackingConnector.logUserActivity(ctx, {
				type: "APPROVAL",
				content: approvalCreated
			}).catch((err) => this.mainProcess.logger.error(err));
			/** Send notification */
			// let notifyToApprovers = [];
			// if (!_.isArray(approvalObj.approvers[approvalLevelObj.level])) {
			// 	notifyToApprovers.push(approvalObj.approvers[approvalLevelObj.level]);
			// } else {
			// 	notifyToApprovers = approvalObj.approvers[approvalLevelObj.level];
			// }
			// // const notifyToUserIds = notifyToApprovers.map((k) => k.userId);
			// if (notifyToApprovers && notifyToApprovers.length > 0) {
			// 	// const sendActs = [];
			// 	const emails = [];
			// 	notifyToApprovers.map((approver) => {
			// 		// sendActs.push(
			// 		//   this.notificationConnector
			// 		//     .sendNotificationToUser(ctx, approver.userId, "",
			// 		//       approvalCreated, "v1.approval.createApprovalForFirstLevel")
			// 		// );
			// 		emails.push(approver.email || approver.userName);
			// 		return approver;
			// 	});
			// 	/** Send to telegram */
			// 	// Promise.all(sendActs);
			// 	/** Send to email */
			// 	this.notificationConnector
			// 		.sendNotificationToEmailUser(ctx, emails, approvalObj.itemName, approvalObj.itemId, approvalObj.itemType);
			// }
			/** Should return data after save because this data will use to set to Notification message */
			return ResponseHelper.resInfo(approvalCreated);
		}
		return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.SAVING_FAILED, null, langCode);
	}

	/** Update approval: state and userProcess and next level person approve
	 * When approval item was created after editor input data.
	 * This function will use for action approve of each level to until state same lasted status level config
	 * @param ctx require: itemId string, itemType string, user object, industry, mainId as projectId
	 * @output object: {code, data, message} */
	async updateApproval(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params.approvalId || FunctionHelper.isEmpty(params.itemId) || FunctionHelper.isEmpty(params.itemType)
			|| FunctionHelper.isEmpty(params.approvalState)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const currentUser = RequestHelper.getCurrentAccount(ctx);
		if (!currentUser || !currentUser.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.USER_NOT_FOUND, null, langCode);
		}
		const currentUserAction = {
			userId: currentUser.userId,
			fullName: currentUser.fullName,
			email: currentUser.userName
		};
		/** Find approval config */
		let approvalConfig = {};
		if (params.itemType.toUpperCase() === APP_SETTING.ITEM_TYPE.PROJECT
			|| params.itemType.toUpperCase() === APP_SETTING.ITEM_TYPE.ARTICLE ) {
			approvalConfig = await this.approvalConfigRepository.findOne({
				industry: params.industry ? params.industry.toUpperCase() : APP_SETTING.INDUSTRY_CODE_DEFAULT,
				type: "MASTER"
			});
		} else {
			approvalConfig = await this.approvalConfigRepository.findOne({
				industry: params.industry ? params.industry.toUpperCase() : APP_SETTING.INDUSTRY_CODE_DEFAULT,
				"data.id": params.mainId
			});
		}
		if (!approvalConfig || FunctionHelper.isEmpty(approvalConfig)
			|| !approvalConfig._id || !approvalConfig.setting
			|| FunctionHelper.isEmpty(approvalConfig.setting)
			|| (!approvalConfig.setting[params.itemType.toLowerCase()]
				&& params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.PROJECT
				&& params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.ARTICLE)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.APPROVAL_CONFIG_NOT_FOUND, null, langCode);
		}
		/** Find approval item need to approve */
		const approvalItem = await this.approvalRepository.getById(params.approvalId);
		if (!approvalItem || FunctionHelper.isEmpty(approvalItem) || !approvalItem._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.ITEM_NOT_FOUND, null, langCode);
		}
		/** Get setting of approval config */
		const approvalSettingTypeObj = approvalConfig.setting[params.itemType.toLowerCase()];
		/** Get first level in setting. First level as first approval after editor input data */
		let approvalPersonLevel = {};
		/** Get current level by user approval */
		let currentLevelApproval = {};
		approvalSettingTypeObj.levels.forEach((levelSetup) => {
			/** Check each level config was setup for correct object key contains user approval */
			if (!approvalSettingTypeObj[levelSetup.level] || _.isEmpty(approvalSettingTypeObj[levelSetup.level])) {
				return levelSetup;
			}
			approvalPersonLevel = approvalSettingTypeObj[levelSetup.level]
				.find((person) => person.userId === currentUser.userId);
			/** Found person approval will stop loop check. Logic at this time each level has only one person approve */
			if (approvalPersonLevel && !FunctionHelper.isEmpty(approvalPersonLevel) && approvalPersonLevel.userId) {
				currentLevelApproval = levelSetup;
			}
			return levelSetup;
		});
		if (!currentLevelApproval || FunctionHelper.isEmpty(currentLevelApproval)) {
			const keysApprover = Object.keys(approvalItem.approvers);
			const currentKey = _.last(keysApprover);
			/** Check current user setup correct approver */
			if (!approvalItem.approvers[currentKey] || approvalItem.approvers[currentKey].userId !== currentUser.userId) {
				return ResponseHelper
					.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.YOU_APPROVED_OR_NOT_PERMISSION,null, langCode);
			}
			currentLevelApproval = approvalSettingTypeObj.levels.find((levelObj) => levelObj.level === currentKey);
		}
		/** Check current level so get next level person */
		const currentLevelIndex = approvalSettingTypeObj.levels.findIndex((k) => k.level === currentLevelApproval.level);
		/** Get approval person from config to set next approval */
		let nextApprovalLevel = {};
		let nextPersonApprovalLevel = {};
		const isLastedLevelApproval = currentLevelIndex === approvalSettingTypeObj.levels.length - 1;
		/** If current level person is lasted level ===> need not get next level */
		if (!isLastedLevelApproval) {
			nextApprovalLevel = approvalSettingTypeObj.levels[currentLevelIndex + 1];
			if (nextApprovalLevel && !params.approver) {
				nextPersonApprovalLevel = _.first(approvalSettingTypeObj[nextApprovalLevel.level]);
			} else if (params.approver) {
				/** If have set next approver in request */
				nextPersonApprovalLevel = params.approver;
			}
		}
		/** Set approvers */
		const { approvers } = approvalItem;
		if (params.approver) {
			/** If request select approval person so set approver = approval person */
			approvers[nextApprovalLevel.level.toLowerCase()] = params.approver;
		} else if (!_.isEmpty(nextPersonApprovalLevel) && nextPersonApprovalLevel.userId) {
			/** Else get next approval person from config */
			approvers[nextApprovalLevel.level.toLowerCase()] = nextPersonApprovalLevel;
		} else if (!isLastedLevelApproval
			&& (!approvers[nextApprovalLevel.level] || _.isEmpty(approvers[nextApprovalLevel.level.toLowerCase()]))) {
			/** This case approval item are: product or article.
			 *  Will auto get next person approve from approval item of project */
			const parentApprovalItem = await this.approvalRepository
				.findOne({itemId: params.mainId, itemType: APP_SETTING.ITEM_TYPE.PROJECT});
			if (!parentApprovalItem || !parentApprovalItem._id) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.MISSING_NEXT_APPROVER, null, langCode);
			}
			approvers[nextApprovalLevel.level.toLowerCase()] = parentApprovalItem
				.approvers[nextApprovalLevel.level.toLowerCase()];
		}
		if (!isLastedLevelApproval
			&& (!approvers[nextApprovalLevel.level.toLowerCase()]
				|| _.isEmpty(approvers[nextApprovalLevel.level.toLowerCase()]))
			&& params.itemType.toUpperCase() !== APP_SETTING.ITEM_TYPE.PROJECT) {
			/** Get approval of project was approved */
			const parentApprovalData = this.approvalRepository.findOne({
				itemId: params.itemId,
				itemType: params.itemType || APP_SETTING.ITEM_TYPE.PROJECT,
				state: {$eq: APP_SETTING.APPROVAL_STATE.PUSBLISH}
			});
			/** So missing data person approval. Dev please check project approval was approved correct data or not */
			if (!parentApprovalData || !parentApprovalData.approvers[nextApprovalLevel.level]) {
				return ResponseHelper
					.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.APPROVER_CONFIG_LEVEL_NOT_FOUND, null, langCode);
			}
			/** Set person approval to person approval was approved for project */
			approvers[nextApprovalLevel.level.toLowerCase()] = parentApprovalData.approvers[nextApprovalLevel.level];
		}
		if (!isLastedLevelApproval && _.isEmpty(approvers[nextApprovalLevel.level.toLowerCase()])) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.APPROVAL.MISSING_NEXT_APPROVER, null, langCode);
		}
		if (params.comment && !_.isEmpty(params.comment)) {
			const commentObj = {
				userId: currentUser.userId,
				fullName: currentUser.fullName,
				email: currentUser.userName,
				note: params.comment
			};
			approvalItem.comments.push(commentObj);
		}
		/** If person set approved state is REJECT so need not update next approval person */
		const updateApprovalItem = await this.approvalRepository.updateOne(
			{_id: FunctionHelper.convertToMongoId(params.approvalId)},
			{
				$set: {
					state: params.approvalState === APP_SETTING.APPROVAL_STATE.REJECT
						? APP_SETTING.APPROVAL_STATE.REJECT : currentLevelApproval.status.toUpperCase(),
					userProcess: currentUserAction,
					approvers,
					comments: approvalItem.comments
				}
			}
		);
		/** If current state was updated to PUBLISH ===> set this item isActive to TRUE */
		if (currentLevelApproval.status === APP_SETTING.APPROVAL_STATE.PUSBLISH) {
			/** Call connector set isActive = true for current item */
			let resultConnector;
			switch (params.itemType.toUpperCase()) {
				case APP_SETTING.ITEM_TYPE.PROJECT: {
					resultConnector = await this.productConnector.setEntityIsActive(ctx, params.itemId);
					break;
				}
				case APP_SETTING.ITEM_TYPE.PRODUCT: {
					resultConnector = await this.productConnector.setProductIsActive(ctx, params.itemId);
					break;
				}
				case APP_SETTING.ITEM_TYPE.ARTICLE: {
					resultConnector = await this.articleConnector.setArticleIsActive(ctx, params.itemId);
					break;
				}
				default: {
					break;
				}
			}
			if (resultConnector.data !== true) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.SAVING_FAILED, null, langCode);
			}
		}
		if (updateApprovalItem.nModified > 0) {
			const approvalItemTracking = await this.approvalModel.getById(params.approvalId);
			/** Tracking activities result */
			this.trackingConnector.logUserActivity(ctx, {
				type: "APPROVAL",
				content: approvalItemTracking
			}).catch((err) => this.mainProcess.logger.error(err));
			/** Send notification */
			// let notifyToApprovers = [];
			// if (isLastedLevelApproval || !approvers[nextApprovalLevel.level]) {
			// 	return super.resolveReturn(approvalItemTracking);
			// }
			// if (!_.isArray(approvers[nextApprovalLevel.level.toLowerCase()])) {
			// 	notifyToApprovers.push(approvers[nextApprovalLevel.level.toLowerCase()]);
			// } else {
			// 	notifyToApprovers = approvers[nextApprovalLevel.level.toLowerCase()];
			// }
			// // const notifyToUserIds = notifyToApprovers.map((k) => k.userId);
			// /** Send to telegram */
			// if (notifyToApprovers && notifyToApprovers.length > 0) {
			// 	const sendActs = [];
			// 	const emails = [];
			// 	notifyToApprovers.map((approver) => {
			// 		// sendActs.push(
			// 		//   this.notificationConnector
			// 		//     .sendNotificationToUser(ctx, approver.userId, "",
			// 		//       approvalItemTracking, "v1.approval.createApprovalForFirstLevel")
			// 		// );
			// 		emails.push(approver.email || approver.userName);
			// 		return approver;
			// 	});
			// 	/** Send to telegram */
			// 	// Promise.all(sendActs);
			// 	/** Send to email */
			// 	this.notificationConnector
			// 		.sendNotificationToEmailUser(ctx, emails, approvalItemTracking.itemName,
			// 			approvalItemTracking.itemId, approvalItemTracking.itemType);
			// }
			/** Should return data after save because this data will use to set to Notification message */
			return ResponseHelper.resInfo(approvalItemTracking);
		}
		return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.SAVING_FAILED, null, langCode);
	}
}

module.exports = ApprovalLogic;