const _ = require("lodash");
const BaseLogic = require("./base.logic");
const {APP_SETTING} = require("../defined");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");

class IndustryLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.productFilterModel = this.models.ProductFilterConfigModel;
	}

	/** Logic: Filter data on Mongo
	 * @param context
	 * @param isUsePortal
	 * @param industry
	 * @output Promise<T> query object
	 */
	async getBuildSearchProductByIndustry(context, isUsePortal = false, industry = null) {
		const templateDataProcessObj = await super.getListTemplateIdByIndustry(industry);
		if (!industry) {
			industry = "bds";
		}
		const industryDataSetting = APP_SETTING.INDUSTRIES.find((x) => x.id === industry
			|| x.code.toUpperCase() === industry.toUpperCase());
		const params = RequestHelper.getParamsByMethodType(context);
		const query = {
			filter: {
				$and: [
					{isDelete: false},
					{isActive: true},
					{templateId: {$in: templateDataProcessObj.listTemplateId}}
				]
			},
			skuFilter: {
				$and: [
					{"skus.isActive": true},
					{"skus.isShowcase": true}
				]
			}
		};
		if (isUsePortal) {
			query.filter.$and.splice(1, 1);
		}
		if (params.keyword) {
			const languageCode = RequestHelper.getLanguageCode(context);
			const nameSearch = {};
			nameSearch[`name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`searchInfo.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchSkuInfo = {};
			searchSkuInfo[`skus.name.${languageCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const productCodeSearch = {
				productCode: FunctionHelper.getRegexStringEqualMongo(params.keyword)
			};
			if (isUsePortal) {
				query.filter.$and.push({$or: [nameSearch, searchInfo, searchSkuInfo, productCodeSearch]});
			} else {
				query.skuFilter.$and.push({$or: [nameSearch, searchInfo, searchSkuInfo, productCodeSearch]});
			}
		}
		const {filterMap, skuFilterMap} = await this.getProductFilterConfigMongo(params, industryDataSetting.code);
		if (filterMap) {
			query.filter.$and.push(...filterMap);
		}
		if (skuFilterMap) {
			query.filter.$and.push(...skuFilterMap);
		}
		return query;
	}

	/** Logic: Filter and search on Elastic
	 * @param context
	 * @param industry
	 * output Promise<T> query object
	 */
	async getBuildSearchProductOnEsByIndustry(context, industry = null) {
		if (!industry) {
			industry = "bds";
		}
		const industryDataSetting = APP_SETTING.INDUSTRIES.find((x) => x.id === industry
			|| x.code.toUpperCase() === industry.toUpperCase());
		const params = super.getParamsByMethodType(context);
		const langCode = super.getLanguageCode(context);
		const query = {
			bool: {
				must: [
					{
						term: {
							isActive: true
						}
					}
				],
				should: []
			},
		};
		/** Processing build query filter dynamic for elastic */
		const {mustMap, shouldMap, keywordMap} = await this.getProductFilterConfigES(params,
			industryDataSetting.code, langCode);
		query.bool.must.push({
			bool: {
				should: keywordMap
			}
		});
		query.bool.must.push(...mustMap);
		query.bool.should.push(...shouldMap);
		return query;
	}

	/** Mapping filter dynamic */
	async getProductFilterConfigMongo(params, type) {
		const filterDataConfig = await this.productFilterModel.getConfig();
		const configFilterObj = filterDataConfig.mongo[type.toLowerCase()];
		if (!configFilterObj) {
			return {};
		}
		/** Mapping params to filter config */
		const listKeyInReq = _.keys(params);
		if (!listKeyInReq || listKeyInReq.length < 1) {
			return {};
		}
		const filterMap = [];
		const skuFilterMap = [];
		/** Get key params in request and process */
		listKeyInReq.map((paramKeyName) => {
			/** Get fields in filter resource */
			const configFilterFields = configFilterObj.filter.fields;
			if (_.isEmpty(configFilterFields)) {
				return paramKeyName;
			}
			/** Find key params in config filter resource */
			const haveFieldConfigFilter = configFilterFields.find((fieldObj) => fieldObj.key === paramKeyName);
			if (haveFieldConfigFilter) {
				/** Process filter by config resource */
				const conditionObj = this.mappingParamKeyToValueMongo(haveFieldConfigFilter, params[paramKeyName]);
				filterMap.push(conditionObj);
			}
			/** Get fields in sku filter resource */
			const configFilterFieldsSku = configFilterObj.skuFilter.fields;
			const haveFieldConfigFilterSku = configFilterFieldsSku.find((fieldObj) => fieldObj.key === paramKeyName);
			if (haveFieldConfigFilterSku) {
				/** Process sku filter by config resource */
				const conditionObj = this.mappingParamKeyToValueMongo(haveFieldConfigFilter, params[paramKeyName]);
				skuFilterMap.push(conditionObj);
			}
			return paramKeyName;
		});
		return {
			filterMap,
			skuFilterMap
		};
	}

	async getProductFilterConfigES(params, type, langCode = "vi") {
		const filterDataConfig = await this.productFilterModel.getConfig();
		const configFilterObj = filterDataConfig.elastic[type.toLowerCase()];
		if (!configFilterObj) {
			return {};
		}
		/** Mapping params to filter config */
		const listKeyInReq = _.keys(params);
		if (!listKeyInReq || listKeyInReq.length < 1) {
			return {};
		}
		const mustMap = [];
		const shouldMap = [];
		let keywordMap = [];
		/** Get key params in request and process */
		listKeyInReq.map((paramKeyName) => {
			/** Get fields in filter resource */
			const mustConfigFilterFields = configFilterObj.must.fields;
			const shouldConfigFilterFields = configFilterObj.should.fields;
			if (_.isEmpty(mustConfigFilterFields)) {
				return paramKeyName;
			}
			const haveMustField = mustConfigFilterFields.find((fieldObj) => fieldObj.key === paramKeyName);
			if (paramKeyName === "keyword") {
				keywordMap = this.mappingParamKeyToValueEs(haveMustField, params[paramKeyName], langCode);
				return paramKeyName;
			}
			/** Find key params in config MUST filter resource */
			if (haveMustField) {
				/** Process filter by config resource */
				const conditionObj = this.mappingParamKeyToValueEs(haveMustField, params[paramKeyName], langCode);
				mustMap.push(conditionObj);
			}
			/** Get fields in config SHOULD filter resource */
			const haveShouldField = shouldConfigFilterFields.find((fieldObj) => fieldObj.key === paramKeyName);
			if (haveShouldField) {
				const conditionObj = this.mappingParamKeyToValueEs(haveShouldField, params[paramKeyName], langCode);
				shouldMap.push(conditionObj);
			}
			return paramKeyName;
		});
		return {
			mustMap,
			shouldMap,
			keywordMap
		};
	}

	mappingParamKeyToValueMongo(fieldConfigFilter, paramsValue) {
		let valueMap;
		const conditionObj = {};
		switch (fieldConfigFilter.type) {
			case "_id":
				valueMap = FunctionHelper.convertToMongoId(paramsValue);
				break;
			case "number":
				valueMap = parseInt(paramsValue, 10);
				break;
			case "array":
				valueMap = _.isArray(paramsValue) ? paramsValue : [paramsValue];
				break;
			case "arrayId":
				valueMap = FunctionHelper.convertToMongoId(paramsValue);
				break;
			case "bool":
				valueMap = JSON.parse(paramsValue);
				break;
			default:
				valueMap = paramsValue;
		}
		conditionObj[fieldConfigFilter.fieldName] = {};
		conditionObj[fieldConfigFilter.fieldName][fieldConfigFilter.operator] = valueMap;
		return conditionObj;
	}

	mappingParamKeyToValueEs(fieldConfigFilter, paramsValue, langCode = "vi") {
		let valueMap;
		const conditionObj = {};
		switch (fieldConfigFilter.type) {
			case "_id":
				valueMap = FunctionHelper.convertToMongoId(paramsValue);
				break;
			case "number":
				valueMap = parseInt(paramsValue, 10);
				break;
			case "array":
				valueMap = _.isArray(paramsValue) ? paramsValue : [paramsValue];
				break;
			case "arrayId":
				valueMap = FunctionHelper.convertToMongoId(paramsValue);
				break;
			case "bool":
				valueMap = JSON.parse(paramsValue);
				break;
			default:
				valueMap = paramsValue;
		}
		conditionObj[fieldConfigFilter.operator] = {};
		/** Working searchOnFields if params have keyword param */
		if (fieldConfigFilter.searchOnFields && fieldConfigFilter.searchOnFields.length > 0) {
			const searchFields = [];
			fieldConfigFilter.searchOnFields.map((fieldSearchName) => {
				const fieldSearch = {};
				fieldSearch[fieldConfigFilter.operator] = {};
				fieldSearch[fieldConfigFilter.operator][
					`${fieldConfigFilter.fieldName}.${fieldSearchName}.${langCode}`] = valueMap;
				searchFields.push(fieldSearch);
				return fieldSearchName;
			});
			return searchFields;
			/** Working condFields if condition type is term */
		} if (fieldConfigFilter.condFields && fieldConfigFilter.condFields.length > 0) {
			conditionObj[fieldConfigFilter.operator][fieldConfigFilter.fieldName] = {};
			fieldConfigFilter.condFields.map((condField) => {
				conditionObj[fieldConfigFilter.operator][fieldConfigFilter.fieldName][condField.condName] = valueMap;
				return condField;
			});
		} else {
			conditionObj[fieldConfigFilter.operator][fieldConfigFilter.fieldName] = valueMap;
		}
		return conditionObj;
	}
}

module.exports = IndustryLogic;
