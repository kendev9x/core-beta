const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const BaseLogic = require("./base.logic");

class SystemSettingLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.systemSettingModel = mainProcess.models.SystemSettingModel;
	}

	/** GET SETTING
	 * @output Promise<T> object: {code, data, message} */
	async getSetting() {
		const setting = await this.systemSettingModel.getSetting();
		return ResponseHelper.resInfo(setting);
	}

	/** GET LIST KEYWORDS PROMOTE
	 * @param ctx context
	 * @output Promise<T> object: {code, data, message} */
	async getListKeyword(ctx) {
		const params = ctx.params.query;
		if (!params || !params.type) {
			return ResponseHelper.resInfo([]);
		}
		const keywords = await this.systemSettingModel
			.getKeywordByType(params.type, params.pageNumber, params.pageSize);
		return ResponseHelper.resInfo(keywords);
	}

	/** POST SAVE KEYWORDS PROMOTE
	 * @param ctx context
	 * @output Promise<T> object: {code, data, message} */
	async saveKeyword(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params.type || !params.keywords) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const result = await this.systemSettingModel.getSetting();
		if (!result || result.length < 1 || !result[0].filter) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.DATA_NOT_FOUND, null, langCode);
		}
		const systemSetting = result[0];
		if (!result[0].filter[params.type] || !result[0].filter[params.type]) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.SETTING.COULD_NOT_FIND_DATA_FILTER, null, langCode);
		}
		const settingKeyword = result[0].filter[params.type];
		/** Found keywords by type in filter config ===> Append keywords to exist data keywords */
		if (settingKeyword.keywords && settingKeyword.keywords.values && _.isArray(settingKeyword.keywords.values)) {
			const setKeywordObj = {};
			setKeywordObj[`filter.${params.type}.keywords.values`] = params.keywords;
			const isUpdate = await this.systemSettingModel.updateSet(
				{_id: this.novaHelper.convertToMongoId(systemSetting._id)},
				{$set: setKeywordObj}
			);
			return ResponseHelper.resInfo(isUpdate.nModified > 0);
		}
		/** Can not find keywords by type in filter config ===> Add new fields keywords to current type filter */
		systemSetting.filter[params.type].keywords = {
			type: "PROMOTE",
			name: {
				vi: "Đề xuất",
				en: "Keywords",
				cn: "Keywords"
			},
			values: params.keywords
		};
		const isAddKeywordField = await this.systemSettingModel.updateSet(
			{_id: this.novaHelper.convertToMongoId(systemSetting._id)},
			systemSetting
		);
		return ResponseHelper.resInfo(isAddKeywordField.nModified > 0);
	}

	/** POST REMOVE KEYWORDS PROMOTE
	 * @param ctx context
	 * @output Promise<T> object: {code, data, message} */
	async removeKeyword(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const langCode = RequestHelper.getLanguageCode(ctx);
		if (!params || !params.type || !params.keywords) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		const result = await this.systemSettingModel.getSetting();
		if (!result || result.length < 1 || !result[0].filter) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.DATA_NOT_FOUND, null, langCode);
		}
		const systemSetting = result[0];
		if (!result[0].filter[params.type] || !result[0].filter[params.type]) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.SETTING.COULD_NOT_FIND_DATA_FILTER, null, langCode);
		}
		const settingKeyword = result[0].filter[params.type];
		if (settingKeyword.keywords && settingKeyword.keywords.values && _.isArray(settingKeyword.keywords.values)) {
			const setKeywordObj = {};
			setKeywordObj[`filter.${params.type}.keywords.values`] = params.keywords;
			const isUpdate = await this.systemSettingModel.updateSet(
				{_id: this.novaHelper.convertToMongoId(systemSetting._id)},
				{$pullAll: setKeywordObj}
			);
			return ResponseHelper.resInfo(isUpdate.nModified > 0);
		}
		return ResponseHelper.resInfo(false);
	}

	/** GET ALERT CONFIG
	 * @param ctx context
	 * @output Promise<T> object: {code, data, message} */
	async getAlertConfig(ctx) {
		const settings = await this.systemSettingModel.getSetting();
		if (!settings || _.isEmpty(settings) || settings.length < 1) {
			return ResponseHelper.resInfo({});
		}
		const setting = settings[0] || {};
		return ResponseHelper.resInfo(setting.alertConfig);
	}
}

module.exports = SystemSettingLogic;