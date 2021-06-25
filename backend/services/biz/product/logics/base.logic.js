const _ = require("lodash");
const {APP_SETTING} = require("../defined");
const { FunctionHelper, RequestHelper } = require("../../../../libs/helpers");

class BaseLogic {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.industryModel = this.mainProcess.models.IndustryModel;
		this.productTemplateModel = this.mainProcess.models.ProductTemplateModel;
		this.entityModel = this.mainProcess.models.EntityModel;
		this.relationTypeModel = this.mainProcess.models.RelationTypeModel;
		this.relationModel = this.mainProcess.models.RelationModel;
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

	buildSelectField(params) {
		if (params.select && _.isArray(params.select)) {
			const selectField = {};
			params.select.map((filedName) => {
				selectField[filedName.toString()] = 1;
				return filedName;
			});
			return selectField;
		}
		return {};
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
				const entities = this.getListEntity(context, listEntId);
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

	async getIndustry(industryParam) {
		const industryObj = await this.industryModel.findOne({
			$or: [
				{_id: FunctionHelper.convertToMongoId(industryParam)},
				{code: FunctionHelper.getRegexStringEqualMongo(industryParam)}
			]
		});
		return industryObj || {};
	}

	async getRelationType(relationTypeParam) {
		return await this.relationTypeModel
			.findOne(
				{
					name: FunctionHelper.getRegexStringEqualMongo(relationTypeParam)
				}) || {};
	}

	async setRemoveEntity(_id, currentAccount) {
		if (!_id) {
			return null;
		}
		const listRelationParentAffected = await this.relationModel.getAll({
			"parent.id": _id
		});
		const listRelationChildAffected = await this.relationModel.getAll({
			"child.id": _id
		});
		if (listRelationParentAffected && listRelationParentAffected.length > 0) {
			listRelationParentAffected.map(async (relation) => {
				relation.isDelete = true;
				relation.updatedBy = currentAccount.userName;
				await this.relationModel.updateOne({_id: relation._id}, relation);
				const childEntIds = relation.child.map((x) => x.id);
				if (!childEntIds && childEntIds.length < 1) {
					return relation;
				}
				const listChildEnt = await this.entityModel.getAll({_id: {$in: childEntIds}});
				if (!listChildEnt && listChildEnt.length < 1) {
					return relation;
				}
				listChildEnt.map(async (childEnt) => {
					childEnt.isDelete = true;
					childEnt.updatedBy = currentAccount.userName;
					await this.entityModel.updateOne({_id: childEnt._id}, childEnt);
					return childEnt;
				});
				return relation;
			});
		}
		if (listRelationChildAffected && listRelationChildAffected.length > 0) {
			listRelationChildAffected.map(async (relation) => {
				await this.relationModel.updateOne({_id: relation._id},
					{
						$pull: {child: {id: _id}},
						updatedBy: currentAccount.userName
					});
				return relation;
			});
		}
		return await this.entityModel.updateOne({_id},
			{$set: {isDelete: true, updatedBy: currentAccount.userName}});
	}

	async buildFilter(params, langCode, isPortalCall = false) {
		const filter = {
			isDelete: false
		};
		if (!isPortalCall) {
			filter.isActive = true;
		}
		if (params.type) {
			filter.type = FunctionHelper.getRegexStringEqualMongo(params.type);
		}
		if (params.ids) {
			filter.ids = { $in: params.ids };
		}
		if (params.types) {
			filter.types = {$in: params.types};
		}
		if (params.keyword) {
			const nameSearch = {};
			nameSearch[`name.${langCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const searchInfo = {};
			searchInfo[`data.searchInfo.name.${langCode}`] = FunctionHelper.getRegexStringContainWithMongo(params.keyword);
			const codeSearch = {
				code: FunctionHelper.getRegexStringEqualMongo(params.keyword)
			};
			filter.$or = [nameSearch, searchInfo, codeSearch];
		}
		if (params.data && _.isObject(params.data) && !_.isEmpty(params.data)) {
			filter.$and = [];
			const keys = _.keys(params.data);
			keys.map((key) => {
				if (_.isUndefined(key) || _.isEmpty(key)) {
					return key;
				}
				const objFilterPush = {};
				objFilterPush[key] = params.data[key];
				filter.$and.push(objFilterPush);
				return key;
			});
		}
		if (params.filter && !_.isEmpty(params.filter)) {
			const keys = _.keys(params.filter);
			keys.map((key) => {
				if (!key || !params.filter[key.toString()]) {
					return key;
				}
				filter[`${key}.${langCode}`] = params.filter[key.toString()];
				return key;
			});
		}
		return filter;
	}

	async createSubEntProject(listEnt, entType, currUser = {}) {
		if (_.isUndefined(listEnt) || !_.isArray(listEnt) || _.isUndefined(entType)) {
			return false;
		}
		const listEntityCreate = listEnt.map((ent) => {
			if (!ent.data || !_.isObject(ent.data)) {
				ent.data = {
					searchInfo: this.createSearchingObject({name: ent.name})
				};
			} else {
				ent.data.searchInfo = this.createSearchingObject({name: ent.name});
			}
			ent.type = entType.toUpperCase();
			ent.createdBy = currUser.defaultUser;
			delete ent.id;
			return ent;
		});
		const listEntCreated = await this.entityModel.createMany(listEntityCreate);
		if (!listEntCreated || !_.isArray(listEntCreated)) {
			return [];
		}
		return listEntCreated.map((x) => x._doc);
	}

	async editSubEntProject(listEnt, entType, currUser = {}, listEntUpsert = []) {
		if (_.isUndefined(listEnt) || !_.isArray(listEnt) || _.isUndefined(entType)) {
			return false;
		}
		const listEntObj = Promise.all(
			listEnt.map(async (ent) => {
				if (ent._id) {
					const existEnt = await this.entityModel.getById(ent._id);
					if (existEnt) {
						existEnt.articleId = ent.articleId;
						existEnt.name = ent.name;
						existEnt.data = ent.data;
						existEnt.updatedBy = currUser.defaultUser;
						if (!existEnt.data || !_.isObject(existEnt.data)) {
							existEnt.data = {
								searchInfo: this.createSearchingObject({name: existEnt.name})
							};
						} else {
							existEnt.data.searchInfo = this.createSearchingObject({name: existEnt.name});
						}
						await this.entityModel.updateOne({_id: ent._id}, existEnt);
						listEntUpsert.push(existEnt);
						return existEnt;
					}
				}
				ent.type = entType.toUpperCase();
				ent.createdBy = currUser.defaultUser;
				if (!ent.data || !_.isObject(ent.data)) {
					ent.data = {
						searchInfo: this.createSearchingObject({name: ent.name})
					};
				} else {
					ent.data.searchInfo = this.createSearchingObject({name: ent.name});
				}
				delete ent.id;
				const entCreated = await this.entityModel.create(ent);
				listEntUpsert.push(entCreated);
				return entCreated;
			})
		);
		await listEntObj;
		return listEntUpsert;
	}

	async buildRelationParams(listEntParam, entityTypeName, arrayReturn) {
		if (!listEntParam || !_.isArray(listEntParam) || listEntParam.length < 1) {
			return arrayReturn;
		}
		listEntParam.map((entParam) => {
			arrayReturn.push({
				parentCode: entParam.parentCode,
				parentType: entParam.parentType,
				childCodes: listEntParam.filter((x) => x.parentCode === entParam.parentCode).map((k) => k.code) || [],
				childType: entityTypeName,
				relationType: `${entParam.parentType}-${entityTypeName}`.toUpperCase()
			});
			return entParam;
		});
		arrayReturn = [...new Set(arrayReturn.map((o) => JSON.stringify(o)))].map((s) => JSON.parse(s));
		return arrayReturn;
	}

	async getRelationTree(parentId, arrayReturn) {
		try {
			if (!parentId || FunctionHelper.isEmpty(parentId)) {
				return arrayReturn;
			}
			const relations = await this.relationModel.getAll({
				"parent.id": parentId,
				"child.id": {$exists: true}, /** Make sure only processing all data have child id (is correct data) */
				isDelete: false
			});
			if (!relations || !_.isArray(relations) || relations.length < 1) {
				return arrayReturn;
			}
			relations.map((relation) => {
				arrayReturn.push({
					relationId: relation._id,
					parent: relation.parent,
					childs: relation.child,
					type: relation.relationType
				});
				return relation;
			});
			const relationChildIds = relations.map((x) => x.child.map((k) => k.id));
			if (!relationChildIds || !_.isArray(relationChildIds) || relationChildIds.length < 1) {
				return arrayReturn;
			}
			await Promise.all(
				relationChildIds.map(async (childId) => {
					await this.getRelationTree(childId, arrayReturn);
				})
			);
			arrayReturn = [...new Set(arrayReturn.map((o) => JSON.stringify(o)))].map((s) => JSON.parse(s));
			return arrayReturn;
		} catch (e) {
			throw Error(e.message);
		}
	}

	/** ONLY USE FOR ATTRIBUTE TYPE PICKLIST ENTITY */
	async processEntityByAttrObj(attrObj, lang = "vi") {
		if (!attrObj || !_.isObject(attrObj)) {
			return attrObj;
		}
		if (!attrObj.value || !_.isObject(attrObj.value) || Object.keys(attrObj.value) < 1) {
			return attrObj;
		}
		let entIds = [];
		if (!_.isArray(attrObj.value[lang])) {
			entIds.push(attrObj.value[lang]);
		} else {
			entIds = attrObj.value[lang];
		}
		if (!entIds || entIds.length < 1) {
			return attrObj;
		}
		const entities = await this.getListEntity(entIds);
		if (!entities || entities.length < 1) {
			return attrObj;
		}
		const entReturn = [];
		if (!_.isArray(attrObj.value[lang])) {
			attrObj.value[lang] = entities.find((ent) => ent._id.toString() === attrObj.value[lang]);
		} else {
			attrObj.value[lang].map((attr) => {
				const entFind = entities.find((ent) => ent._id.toString() === attr);
				entReturn.push(entFind);
				return attr;
			});
			attrObj.value[lang] = entReturn;
		}
		return attrObj;
	}

	async processAttributeRef(ctx, mainEntInfo, langCode = "vi") {
		if (!mainEntInfo || !mainEntInfo.data || !_.isObject(mainEntInfo.data)) {
			return mainEntInfo;
		}
		const keys = Object.keys(mainEntInfo.data);
		if (!_.isArray(keys) || keys.length < 1) {
			return mainEntInfo;
		}
		await Promise.all(keys.map(async (keyAttr) => {
			if (!mainEntInfo.data[keyAttr] || !mainEntInfo.data[keyAttr].type) {
				return keyAttr;
			}
			if (mainEntInfo.data[keyAttr].type === "plent" && !_.isArray(mainEntInfo.data[keyAttr].value[langCode])) {
				const entityData = await this.entityModel.getById(mainEntInfo.data[keyAttr].value[langCode]);
				if (entityData) {
					mainEntInfo.data[keyAttr].value[langCode] = entityData;
				}
			}
			if (mainEntInfo.data[keyAttr].type === "plent" && _.isArray(mainEntInfo.data[keyAttr].value[langCode])) {
				const listEntIds = [];
				mainEntInfo.data[keyAttr].value[langCode].map((entId) => {
					listEntIds.push(entId);
					return entId;
				});
				const listEntData = await this.entityModel.getAll({_id: {$in: listEntIds}});
				if (listEntData) {
					const entMaps = [];
					mainEntInfo.data[keyAttr].value[langCode].map((value) => {
						const entityData = listEntData.find((k) => k._id.toString() === value);
						if (entityData) {
							entMaps.push(entityData);
						}
						return value;
					});
					mainEntInfo.data[keyAttr].value[langCode] = entMaps;
				}
			}
			return keyAttr;
		}));
		return mainEntInfo;
	}

	async processRelationEntity(relations, mainEntId) {
		if (!relations || !_.isArray(relations)) {
			return relations;
		}
		const entIds = [];
		relations.map((relation) => {
			if (relation.parent && relation.parent.id !== mainEntId) {
				entIds.push(relation.parent.id);
			}
			if (relation.child && relation.child.values && _.isArray(relation.child.values)) {
				relation.child.values.map((childObj) => {
					if (childObj.id && !_.isEmpty(childObj.id) && childObj.id !== "") {
						entIds.push(childObj.id);
					}
					return childObj;
				});
			}
			return relation;
		});
		if (entIds.length < 1) {
			return relations;
		}
		const entities = await this.getListEntity(entIds);
		if (!entities || entities.length < 1) {
			return relations;
		}
		relations.map((relation) => {
			relation.parent.info = entities.find((k) => k._id.toString() === relation.parent.id);
			if (relation.child.values.length < 1) {
				return relation;
			}
			relation.child.values.map((childObj) => {
				childObj.info = entities.find((k) => k._id.toString() === childObj.id);
				return childObj;
			});
			return relation;
		});
		return relations;
	}

	async getListEntity(ids) {
		if (!ids || !_.isArray(ids)) {
			return [];
		}
		const entities = this.entityModel.getAll({_id: {$in: ids}});
		if (!entities || entities.length < 1) {
			return [];
		}
		return entities;
	}

	/** PRIVATE FUNCTIONS USE FOR ENTITY LOGIC OR ANOTHER LOGICS AT SAME SERVICE*/

	/** PRIVATE FUNC: GET ENTITIES BY LIST ID
	 * @param context
	 * @param ids: entity id
	 * @param sortObj: sorting object as {createdAt: -1}
	 * @param formatData: true or false - format to clean data
	 * @output Promise<T> List Entity
	 */
	async funcGetListEntity(context, ids = [], sortObj = {}, formatData = false) {
		if (FunctionHelper.isEmpty(ids)) {
			return [];
		}
		const langCode = RequestHelper.getLanguageCode(context);
		const filter = {
			_id: {$in: FunctionHelper.convertToMongoId(ids)},
			isActive: true,
			isDelete: false
		};
		let data =  await this.entityModel.getAll(filter, sortObj);
		if (formatData) {
			data = await this.entityDto.planeData(context, data, langCode);
		}
		return data;
	}

	/** PRIVATE FUNC: GET ENTITIES BY TYPE
	 * @param context
	 * @param type: entity type code
	 * @param sortObj: sorting object as {createdAt: -1}
	 * @param formatData: true or false - format to clean data
	 * @output Promise<T> List Entity
	 */
	async funcGetEntitiesByType(context, type = [], sortObj = {}, formatData = false) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(params.type)) {
			return [];
		}
		const filter = {
			type: {$in: FunctionHelper.getRegexStringEqualMongo(type)}
		};
		let result = await this.entityModel.getAll(filter, sortObj);
		if (formatData) {
			result = await this.entityDto.planeData(context, result, langCode);
		}
		return result;
	}

	/** PRIVATE FUNC: GET ENTITIES BY TYPE
	 * @param context
	 * @param id: entity id
	 * @param formatData: true or false - format to clean data
	 * @output Promise<T> Entity Object
	 */
	async funcGetEntityById(context, id, formatData = false) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (FunctionHelper.isEmpty(id)) {
			return [];
		}
		let entityObj = await this.entityModel.getById(params.id);
		if (!entityObj || _.isEmpty(entityObj)) {
			return {};
		}
		const relations = await this.relationModel.getAll(
			{$or: [{"parent.id": params.id}, {"child.id": {$in: [params.id]}}]}
		);
		if (relations && relations.length > 0) {
			entityObj.relations = relations.map((x) => ({
				_id: x._id,
				child: x.child,
				parent: x.parent,
				industry: x.industry,
				type: x.relationType.name
			}));
		}
		if (formatData) {
			entityObj = await this.entityDto.planeData(context, entityObj, langCode);
		}
		return entityObj;
	}

	async funcGetRelationTypeById(context, id) {
		if (!id) {
			return {};
		}
		return await this.relationTypeModel.getById(id);
	}

	async funcGetRelationTypeByCode(context, code) {
		if (!code) {
			return {};
		}
		return await this.relationTypeModel.findOne({
			code: FunctionHelper.getRegexStringEqualMongo(code)
		});
	}

}

module.exports = BaseLogic;