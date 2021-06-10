const _ = require("lodash");
const {APP_SETTING} = require("../defined");
const { FunctionHelper } = require("../../../../libs/helpers");

class BaseLogic {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.productTemplateModel = this.mainProcess.models.ProductTemplateModel;
		this.entityModel = this.mainProcess.models.EntityModel;
	}

	createSearchingObject(object) {
		if (!object) {
			return {};
		}
		const objectProcess = JSON.parse(JSON.stringify(object));
		const objectProps = Object.keys(objectProcess);
		if (!objectProps || objectProps.length < 1) {
			return {};
		}
		const searchingComposeObj = {};
		objectProps.map((key) => {
			if (!objectProcess[key]) {
				return key;
			}
			if (objectProcess[key].vi) {
				objectProcess[key].vi = FunctionHelper.convertUnicode(objectProcess[key].vi);
			}
			searchingComposeObj[key] = objectProcess[key];
			return key;
		});
		return searchingComposeObj;
	}

	genSkus(attrs, langCode) {
		if (!attrs || attrs.length < 1) {
			return [];
		}
		const listAttr = [];
		attrs.map((attr) => {
			const {
				name, isFilter, key, type,
			} = attr;
			const { values } = attr;
			listAttr.push({
				name,
				values,
				isFilter,
				key,
				type,
			});
			return attr;
		});
		let totalSku = 0;
		const skus = [];
		listAttr.map((attr, index) => {
			if (index === 0) {
				totalSku = attr.values.length;
			} else {
				totalSku *= attr.values.length;
			}
			return attr;
		});
		const dataReturn = {
			totalSku,
			skus,
		};
		if (totalSku < 1) {
			return dataReturn;
		}
		if (listAttr.length === 1) {
			listAttr[0].values.map((val) => {
				let curValueLang = "";
				if (listAttr[0].type === "TEXT" && Object.keys(val).length > 0) {
					curValueLang = val[langCode];
				} else {
					curValueLang = val;
				}
				const langS = Object.keys(listAttr[0].name);
				const genName = {};
				if (langS.length > 0) {
					langS.map((lang) => {
						if (listAttr[0].name[lang]) {
							genName[lang] = `${listAttr[0].name[lang]
								? listAttr[0].name[lang] : ""} : ${val[lang] ? val[lang] : val}`;
						} else {
							genName[lang] = "";
						}
						return lang;
					});
				}
				const skuObj = {
					defaultName: `${listAttr[0].name[langCode]}: ${curValueLang}`,
					genName,
					values: [],
				};
				skuObj.values.push({
					name: listAttr[0].name,
					isFilter: listAttr[0].isFilter,
					key: listAttr[0].key,
					type: listAttr[0].type,
					value: val,
				});
				skus.push(skuObj);
				return val;
			});
			dataReturn.skus = skus;
			return dataReturn;
		}
		const totalAttValues = [];
		listAttr.map((attr, index) => {
			if (index !== 0) {
				totalAttValues.push({ index, name: attr.name, values: attr.values });
			}
			return attr;
		});
		const firstAttr = listAttr[0];
		const dataSkus = [];
		firstAttr.values.map((attr) => {
			const currAttr = { name: firstAttr.name, value: attr };
			this.createSku(currAttr, totalAttValues, dataSkus, langCode);
			return attr;
		});
		dataReturn.skus = dataSkus.map((sku) => {
			return {
				defaultName: sku.defaultName,
				genName: sku.genName,
				values: [],
			};
		});
		if (dataReturn.skus) {
			dataReturn.skus = dataReturn.skus
				.filter((sku) => FunctionHelper.findOccurrences(sku.defaultName, "$$") === listAttr.length - 1);
		}
		dataReturn.skus.map((sku) => {
			sku.values = [];
			const attrGroups = sku.defaultName.split("$$");
			attrGroups.map((attrGroup) => {
				const attrObjs = attrGroup.split(":");
				const attrName = attrObjs[0];
				const attrValue = attrObjs[1];
				const filterObj = listAttr.find((attr) => attr.name[langCode] === attrName);
				const valueObj = {
					name: attrName,
					value: attrValue,
					isFilter: filterObj && filterObj.isFilter
						? filterObj.isFilter : false,
					key: filterObj && filterObj.key
						? filterObj.key : "",
					type: filterObj.type,
				};
				sku.values.push(valueObj);
				return attrGroup;
			});
			return sku;
		});
		return dataReturn;
	}

	createSku(currAttr, listAttrValues, dataReturn = [], langCode) {
		listAttrValues.map((attr) => {
			attr.values.map((value) => {
				const langS = !currAttr.name ? [] : Object.keys(currAttr.name);
				let currName = currAttr.name;
				if (currName !== null && typeof currName === "object") {
					currName = currName[langCode] ? currName[langCode] : currName[Object.keys(currName)[0]];
				} else {
					currName = currAttr;
				}
				const attrName = attr.name;
				let attrNameText = "";
				if (attrName !== null && typeof attrName === "object") {
					attrNameText = attrName[langCode] ? attrName[langCode] : attrName[Object.keys(attrName)[0]];
				}
				const currValue = {
					defaultName: "",
					genName: {},
					attrs: [],
				};
				if (!currAttr.value) {
					currValue.defaultName = `${currName}$$${attrNameText}:${
						Object.keys(value).length > 1 ? value[langCode] : value}`;
					currAttr.value = value;
				} else {
					const curValueText = Object.keys(currAttr.value).length > 1
						? currAttr.value[langCode] : currAttr.value;
					const nextValueText = Object.keys(value).length > 1 ? value[langCode] : value;
					currValue.defaultName = `${currName}:${curValueText}$$${attrNameText}:${nextValueText}`;
				}
				langS.map((lang) => {
					const currNameLang = `${currAttr.name[lang] ? currAttr.name[lang] : ""}`;
					const attrNameLang = `${attrName[lang] ? attrName[lang] : attrName}`;
					const currValProp = `${Object.keys(currAttr.value).length > 1 ? currAttr.value[lang] : currAttr.value}`;
					const valProp = `${Object.keys(value).length > 1 ? value[lang] : value}`;
					if (!currAttr.value) {
						if (currAttr.name[lang]) {
							currValue.genName[lang] = `${currNameLang}$$${attrNameLang}:${valProp}`;
						}
					} else if (currAttr.name[lang]) {
						if (currValProp === valProp) {
							currValue.genName[lang] = `${currNameLang}$$${attrNameLang}:${valProp}`;
						} else {
							currValue.genName[lang] = `${currNameLang}:${currValProp}$$${attrNameLang}:${valProp}`;
						}
					}
					return lang;
				});
				currValue.name = currValue.genName;
				dataReturn.push(currValue);
				const filterAttr = listAttrValues.filter((s) => s.index > attr.index);
				this.createSku(currValue, filterAttr, dataReturn, langCode);
				return value;
			});
			return attr;
		});
		return dataReturn;
	}

	genericObjectFromArray(arrayObject, langCode) {
		if (!arrayObject || !Array.isArray(arrayObject) || arrayObject.length < 1) {
			return {};
		}
		const obj = {};
		arrayObject.map((item) => {
			let textLang = "";
			if (!item.key || item.key === "") {
				if (item.label && Object.keys(item.label).length > 1) {
					textLang = FunctionHelper.translateContent(item.label, langCode);
				} else if (item.name && Object.keys(item.name).length > 1) {
					textLang = FunctionHelper.translateContent(item.name, langCode);
				}
				const repStr = FunctionHelper.replaceString(Object.keys(textLang).length < 1
					? textLang.toLowerCase() : textLang[langCode].toLowerCase(), " ", "_");
				item.key = FunctionHelper
					.removeAllSpaceAndSpecialChars(FunctionHelper.convertUnicode(repStr));
				obj[`${item.key}_${item.type.toLowerCase()}`] = item.value;
			} else {
				obj[`${item.key}`] = item.value;
			}
			return item;
		});
		return obj;
	}

	async getListTemplateIdByIndustry(industry) {

		let industryValue = null;
		if (!industry) {
			industryValue = APP_SETTING.INDUSTRIES.find((x) => x.code === "BDS").id;
		}
		if (!industryValue) {
			let industryObj = APP_SETTING.INDUSTRIES.find((x) => x.id === industry);
			industryObj = !industryObj
				? APP_SETTING.INDUSTRIES.find((x) => x.code.toUpperCase() === industry.toUpperCase())
				: industryObj;
			industryValue = industryObj ? industryObj.id : "";
		}
		const templates = await this.productTemplateModel.getAll({industry: industryValue});
		const dataReturn = {
			industry,
			listTemplateId: []
		};
		if (!templates || templates.length < 1) {
			return dataReturn;
		}
		dataReturn.listTemplateId = templates.map((k) => k._id.toString());
		return dataReturn;
	}

	async buildFilterCheckExist(objInput, fieldName, industry = "") {
		let listTemplateId = [];
		if (!industry || !_.isEmpty(industry)) {
			const industryObj = await this.getListTemplateIdByIndustry(industry);
			listTemplateId = industryObj.listTemplateId;
		}
		const keysLangName = Object.keys(objInput);
		const queryCheckExistName = {
			$or: []
		};
		keysLangName.map((keyCode) => {
			const obj = {
			};
			const checkEmptyObj = {
			};
			obj[`${fieldName}.${keyCode}`] = objInput[keyCode];
			checkEmptyObj[`${fieldName}.${keyCode}`] = {$ne: ""};
			const $andFilter = [];
			if (!_.isEmpty(listTemplateId)) {
				$andFilter.push({templateId: {$in: listTemplateId}});
			}
			$andFilter.push(obj);
			$andFilter.push(checkEmptyObj);
			$andFilter.push({isDelete: false});
			queryCheckExistName.$or.push({$and: $andFilter});
			return keyCode;
		});
		return queryCheckExistName;
	}

	buildSkuCodeUnique() {
		const date = `${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}`;
		const genNum = FunctionHelper.generateRandomNumber(5, "", date, "-");
		return FunctionHelper.generateRandomStringCustom("A", 6,
			{}, "SKU-", genNum, "");
	}

	getIndexEsByIndustry(industry) {
		if (!industry) {
			return null;
		}
		const industryDataSetting = APP_SETTING.INDUSTRIES.find((x) => x.id === industry || x.code === industry);
		if (!industryDataSetting) {
			return -1;
		}
		return industryDataSetting.esIndex;
	}

	async mappingToEntity(context, result) {
		let templateIds = result.map((x) => x.templateId);
		templateIds = [...new Set(templateIds)].find((x) => x !== undefined);
		const listTemplate = await this.productTemplateModel.getAll({_id: {$in: templateIds}});
		let listEntId = [];
		let listEnt = [];
		const pAll = [];
		let listAttrKey = [];
		result.map((product) => {
			const keyAttrs = Object.keys(product.attrs);
			listAttrKey = keyAttrs;
			if (keyAttrs && keyAttrs.length > 0) {
				keyAttrs.map((key) => {
					if (product.attrs[key].type.toUpperCase() === "PLENT") {
						listEntId = [...listEntId, ...product.attrs[key].values];
					}
					return key;
				});
			}
			if (listEntId.length > 0) {
				const entities = this.entityModel.findByListId(listEntId);
				pAll.push(entities);
			}
			product.template = listTemplate.find((x) => x._id.toString() === product.templateId);
			product.listAttrKey = listAttrKey;
			return product;
		});
		if (pAll.length > 0) {
			listEnt = await Promise.all(pAll);
		}
		result.map((product) => {
			listEnt.map((ents) => {
				if (ents && ents.length > 0) {
					product.listEnt = [];
					ents.map((ent) => product.listEnt.push(ent));
				}
				return ents;
			});
			return product;
		});
		return result;
	}
}

module.exports = BaseLogic;