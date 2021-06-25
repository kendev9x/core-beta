/** Tan created 08032020 * */
const _ = require("lodash");

class EntityTransfer {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.models = mainProcess.models;
		this.entityModel = this.models.EntityModel;
	}

	/** PRIVATE FUNCTION: PROCESSING DATA ENTITY RETURN FOR APP
	 * @param ctx: context
	 * @param dataEnt: list entity get from db
	 * @param langCode: language code*/
	async planeData(ctx, dataEnt, langCode) {
		if (!_.isArray(dataEnt) || !_.isObject(dataEnt)
			|| _.isEmpty(dataEnt) || _.isUndefined(dataEnt)) {
			return dataEnt;
		}
		const dataReturn = [];
		if (_.isArray(dataEnt)) {
			await Promise.all(dataEnt.map(async (entity) => {
				const formatEnt = await this.mappingDetail(ctx, entity, langCode);
				dataReturn.push(formatEnt);
				return entity;
			}));
		}
		return dataReturn;
	}

	/** PRIVATE FUNCTION: PROCESSING DATA ENTITY
	 * @param ctx: context
	 * @param entity: entity get from db
	 * @param langCode: language code*/
	async mappingDetail(ctx, entity, langCode) {
		const dataFormat = {
			_id: entity._id,
			name: entity.name[langCode],
			createdAt: entity.createdAt,
			updatedAt: entity.updatedAt,
			articleId: entity.articleId,
			code: entity.code,
			data: {}
		};
		if (_.isEmpty(entity.data) || _.isUndefined(entity.data)) {
			return dataFormat;
		}
		/** Get keys in object data of entity */
		const keysInDataObj = _.keys(entity.data);
		if (keysInDataObj.length < 1) {
			return dataFormat;
		}
		/** Get list entity id in data object have props type is plent */
		const listEntId = [];
		keysInDataObj.map((key) => {
			const typeInput = entity.data[key].type || "";
			if (typeInput.toUpperCase() === "PLENT") {
				const value = entity.data[key].value[langCode] || null;
				if (!_.isUndefined(value) && !_.isEmpty(value) && !listEntId.find((x) => x === value)) {
					if (_.isArray(value)) {
						value.map((entId) => {
							listEntId.push(entId);
							return entId;
						});
					} else {
						listEntId.push(value);
					}
				}
			}
			return key;
		});
		/** Get entity ref by list entId */
		let listEnt = [];
		if (listEntId.length > 0) {
			listEnt = await this.entityModel.getByListId(listEntId);
		}
		/** Process child props in data object */
		keysInDataObj.map((key) => {
			const childProp = {};
			const typeInput = entity.data[key].type || "";
			/** Child props have value is normal input: text, number, date, image, select ... */
			if (typeInput && typeInput.toUpperCase() !== "PLENT") {
				/** Data value always object when created because old structure use language for all input type */
				if (_.isObject(entity.data[key].value)) {
					childProp.value = entity.data[key].value ? entity.data[key].value[langCode] : {};
					/** If value is array */
					if (_.isArray(entity.data[key].value[langCode])) {
						childProp.value = entity.data[key].value[langCode].map((valObj) => {
							/** If value is image so just return file name */
							if (entity.data[key].type && entity.data[key].type.toUpperCase() === "IMAGE") {
								valObj = valObj.filename;
							}
							return valObj;
						});
					}
				}
			} else {
				/** Input type is pick list entity */
				childProp.value = entity.data[key].value ? entity.data[key].value[langCode] : {};
				if (_.isArray(childProp.value)) {
					const valueEntArr = [];
					/** If value of pick list entity is array */
					childProp.value.map((val) => {
						const dataEntRef = listEnt.find((ent) => ent._id.toString() === val);
						valueEntArr.push({
							name: dataEntRef ? dataEntRef.name[langCode] : "",
							value: dataEntRef ? dataEntRef._id : ""
						});
						return val;
					});
					childProp.value = valueEntArr;
				} else {
					const entRef = listEnt.find((ent) => ent._id.toString() === childProp.value);
					childProp.value = {
						name: entRef ? entRef.name[langCode] : "",
						value: entRef ? entRef._id : ""
					};
				}
			}
			/** Child props have data extend object for business required */
			if (!_.isEmpty(entity.data[key].dataExt) || !_.isUndefined(entity.data[key].dataExt)) {
				const keys = _.keys(entity.data[key].dataExt);
				keys.map((keyExt) => {
					if (_.isArray(entity.data[key].dataExt[keyExt])) {
						entity.data[key].dataExt[keyExt].map((extDataInfo) => {
							extDataInfo = {
								name: extDataInfo.name[langCode],
								info: extDataInfo.info
							};
							return extDataInfo;
						});
					}
					return keyExt;
				});
			}
			dataFormat.data[key] = childProp.value;
			return key;
		});
		return dataFormat;
	}
}

module.exports = EntityTransfer;
