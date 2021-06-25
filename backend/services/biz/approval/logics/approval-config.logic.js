const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { APP_SETTING } = require("../defined");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const { TrackingConnector } = require("../connectors");
const { ApprovalLogic } = require("../logics");
const BaseLogic = require("./base.logic");

class ApprovalConfigLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.approvalConfigModel = this.models.ApprovalConfigModel;
		this.approvalModel = this.models.ApprovalModel;
		this.approvalLogic = new ApprovalLogic(mainProcess);
		this.trackingConnector = new TrackingConnector(mainProcess);
	}

	/** GET MASTER CONFIG APPROVAL
	 * @description this master config approval use to set approval level person when create project
	 * @param ctx
	 * @output object: {code, data, message} */
	async getConfigMasterWhenCreateProject(ctx) {
		const masterConfig = await this.approvalConfigModel.findOne(
			{
				industry: "BDS",
				type: "MASTER"
			}
		);
		return ResponseHelper.resInfo(masterConfig);
	}

	/** POST CREATE A APPROVAL CONFIG.
	 * Description: When create contents for a project. we will need to create default config approval with that project.
	 * @param ctx: require fields: itemId is id _id of project entity
	 * Approvals will to set by manual at this time after default config approval created */
	async createConfigDefaultForContentWithProject(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || FunctionHelper.isEmpty(params) || !params.itemId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const configDefault = {
			industry: params.industry || "BDS",
			type: "PROJECT",
			data: {
				id: params.itemId, // _id of main data need to create config as project id
				name: params.itemName,
			},
			setting: {
				product: {
					levels: APP_SETTING.DEFAULT_LEVELS,
				},
				article: {
					levels: APP_SETTING.DEFAULT_LEVELS
				}
			}
		};
		APP_SETTING.DEFAULT_LEVELS.forEach((defaultLevelObj) => {
			configDefault.setting.product[defaultLevelObj.level] = [];
			configDefault.setting.article[defaultLevelObj.level] = [];
		});
		const approvalConfigCreated = await this.approvalConfigModel.create(configDefault);
		if (approvalConfigCreated && approvalConfigCreated._id) {
			/** Create first approval for item as PROJECT item */
			await this.approvalService.createApprovalForFirstLevel(ctx);
			/** Tracking data */
			this.trackingConnector.logUserActivity(ctx, {
				type: "APPROVAL-CONFIG",
				content: approvalConfigCreated
			}).then((r) => r);
		}
		return ResponseHelper.resInfo(approvalConfigCreated);
	}

	/** UPDATE CONFIG VIA MAIN DATA AS PROJECT ID.
	 * Description: When project was approves via person and approve level. Need to update this person and level approve
	 * to product and article in this project
	 * @param ctx: require fields: mainId as project id, mainType, settingApprove: levels and approvers object */
	async updateApprovalConfigForMainData(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params.mainId || !params.mainType || !params.settingApprove) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const filter = {
			type: params.mainType || "PROJECT",
			"data.id": params.mainId
		};
		const isUpdateApproversForProductAndArticle = await this.approvalConfigModel.updateOne(filter, {
			$set: {
				"setting.product": params.settingApprove,
				"setting.article": params.settingApprove
			}
		});
		return ResponseHelper.resInfo(isUpdateApproversForProductAndArticle.nModified > 0);
	}

	/** GET CONFIG VIA MAIN DATA AS PROJECT ID
	 * Description: Get config for a main data as project for set approval setting for content of project
	 * @param ctx: require fields: mainId as project id, mainType as data type as PROJECT */
	async getApprovalConfigForMainData(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || FunctionHelper.isEmpty(params) || !params.mainId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const filter = {
			type: params.mainType || "PROJECT",
			"data.id": params.mainId
		};
		const result = await this.approvalConfigModel.findOne(filter);
		return ResponseHelper.resInfo(result);
	}

	/** */
	/** Get config for bam tree approval
	 * Description: Get config for bam tree approval
	 * @param ctx: require fields: mainId as project id, mainType as data type as PROJECT */
	async getApprovalConfigForBam(ctx) {
		const filter = {
			type: "BAM"
		};
		const result = await this.approvalConfigRepo.findOne(filter);
		return ResponseHelper.resInfo(result);
	}

}

module.exports = ApprovalConfigLogic;