const _ = require("lodash");
const { FunctionHelper } = require("../../../../../libs/helpers");
const BaseTransfer = require("./base.transfer");

class ProductDto extends BaseTransfer {
	constructor(languageCode) {
		super(languageCode);
	}

	mappingList(listEnt) {
		return listEnt.map((ent) => this.mappingBasic(ent));
	}

	mappingBasic(ent) {
		if (!ent) {
			return {};
		}
		return {
			_id: ent._id,
			name: ent.name,
			templateId: ent.templateId,
			templateName: ent.template ? ent.template.name : "",
			price: !ent.price ? 0 : ent.price,
			quantity: !ent.quantity ? 0 : ent.quantity,
			img: ent.img,
			photos: ent.photos,
			attrs: ent.attrs,
			shortDesc: ent.shortDesc,
			description: ent.description,
			isActive: ent.isActive,
			createDate: ent.createDate,
			createdAt: ent.createdAt,
			createBy: ent.createBy,
			updateDate: ent.updateDate,
			updatedAt: ent.updatedAt,
			updateBy: ent.updateBy
		};
	}

	mappingObj(ent) {
		if (!ent) {
			return {};
		}
		delete ent.searchInfo;
		delete ent.createAt;
		delete ent.updateAt;
		return ent;
	}

	mappingListSku(listEnt) {
		return listEnt.map((ent) => this.mappingSkuOrProduct(ent));
	}

	mappingSkuOrProduct(ent) {
		if (!ent) {
			return {};
		}
		const attrsMappingObj = this.processingAttributesTrans(ent.attrs, ent.listAttrKey, ent.listEnt);
		const productInfo = {
			_id: ent._id ? ent._id.toString() : "",
			productCode: ent.productCode,
			// id: ent.skus && ent.skus.sku ? ent.skus.sku : ent._id,
			sku: ent.skus && ent.skus.sku ? ent.skus.sku : "",
			name: ent.skus && ent.skus.sku ? ent.skus.name : ent.name,
			templateId: ent.templateId,
			templateName: ent.template ? ent.template.name : "",
			price: ent.skus && ent.skus.price ? ent.skus.price : ent.price,
			quantity: ent.skus && ent.skus.quantity ? ent.skus.quantity : ent.quantity,
			img: ent.skus && ent.skus.img ? ent.skus.img : ent.img,
			photos: ent.skus && ent.skus.photos ? ent.skus.photos : ent.photos,
			shortDesc: ent.skus && ent.skus.shortDesc ? ent.skus.shortDesc : ent.shortDesc,
			description: ent.skus && ent.skus.description ? ent.skus.description : ent.description,
			attrs: attrsMappingObj.attrs,
			skus: _.isObject(ent.skus) ? ent.skus : {},
			isActive: ent.isActive,
			createDate: ent.createDate,
			createdAt: ent.createdAt,
			createBy: ent.createBy,
			updateDate: ent.updateDate,
			updatedAt: ent.updatedAt,
			updateBy: ent.updateBy
		};
		return productInfo;
	}

	processingAttributesTrans(attrs, listAttrKey, listEnt, getDataOfEntityByName = "") {
		if (!attrs || !listAttrKey || listAttrKey.length < 1) {
			return {};
		}
		let dataOfEntityByName = {};
		const data = listAttrKey.map((key) => {
			if (!attrs[key]) {
				return key;
			}
			if (attrs[key].type.toUpperCase() === "PLENT") {
				attrs[key].values = !attrs[key].values ? []
					: attrs[key].values.map((value) => {
						const currEnt = !listEnt ? [] : listEnt.find((entObj) => entObj._id.toString() === value);
						const valueObj = {
							name: currEnt ? currEnt.name : {vi: ""},
							value,
						};
						if (key.toLowerCase() === getDataOfEntityByName.toLowerCase()) {
							dataOfEntityByName = currEnt ? currEnt.data : null;
						}
						return valueObj;
					});
			}
			return attrs;
		});
		if (data.length < 1) {
			return { attrs, dataOfEntityByName };
		}
		return { attrs: data[0], dataOfEntityByName };
	}

	mapSyncDataEsForRealEstate(listProducts) {
		if (!listProducts || !_.isArray(listProducts) || listProducts.length < 0) {
			return [];
		}
		const listProductSync = [];
		listProducts.map((product) => {
			const attrsMappingObj = this.processingAttributesTrans(
				product.attrs, product.listAttrKey, product.listEnt, "project"
			);
			const productInfo = {
				pid: product._id ? product._id.toString() : "",
				id: product.skus && product.skus.sku ? product.skus.sku : product._id,
				productCode: product.productCode || "",
				name: product.skus && product.skus.sku ? product.skus.name : product.name,
				templateId: product.templateId,
				templateName: product.template ? product.template.name : "",
				price: product.skus && product.skus.price ? product.skus.price : product.price,
				quantity: product.skus && product.skus.quantity ? product.skus.quantity : product.quantity,
				img: product.skus && product.skus.img ? product.skus.img : product.img,
				photos: product.skus && product.skus.photos ? product.skus.photos : product.photos,
				shortDesc: product.skus && product.skus.shortDesc ? product.skus.shortDesc : product.shortDesc,
				description: product.skus && product.skus.description ? product.skus.description : product.description,
				attrs: attrsMappingObj.attrs,
				skus: _.isObject(product.skus) ? product.skus : {},
				isActive: product.isActive,
				createDate: product.createDate,
				createdAt: product.createdAt,
				createBy: product.createBy,
				updateDate: product.updateDate,
				updatedAt: product.updatedAt,
				updateBy: product.updateBy,
				fullTextSearch: {
					name: product.skus && product.skus.sku ? product.skus.name : product.name,
					project: attrsMappingObj.attrs.project
					&& attrsMappingObj.attrs.project.values
					&& attrsMappingObj.attrs.project.values.length > 0 ? attrsMappingObj.attrs.project.values[0].name : null,
					typeHouse: attrsMappingObj.attrs.typeHouse
					&& attrsMappingObj.attrs.typeHouse.values
					&& attrsMappingObj.attrs.typeHouse.values.length > 0 ? attrsMappingObj.attrs.typeHouse.values[0].name : null,
				}
			};
			productInfo.fullTextSearch.address = attrsMappingObj.attrs.project
				? FunctionHelper.getFullTextAddressByLocation(attrsMappingObj.dataOfEntityByName) : "";
			listProductSync.push(productInfo);
			return product;
		});
		return listProductSync;
	}

	mapSyncDataEsForCitiGym(listProducts) {
		if (!listProducts || !_.isArray(listProducts) || listProducts.length < 0) {
			return [];
		}
		const listProductSync = [];
		listProducts.map((product) => {
			const attrsMappingObj = this.processingAttributesTrans(
				product.attrs, product.listAttrKey, product.listEnt, "club"
			);
			const productInfo = {
				pid: product._id ? product._id.toString() : "",
				id: product.skus && product.skus.sku ? product.skus.sku : product._id,
				productCode: product.productCode || "",
				name: product.skus && product.skus.sku ? product.skus.name : product.name,
				templateId: product.templateId,
				templateName: product.template ? product.template.name : "",
				price: product.skus && product.skus.price ? product.skus.price : product.price,
				quantity: product.skus && product.skus.quantity ? product.skus.quantity : product.quantity,
				img: product.skus && product.skus.img ? product.skus.img : product.img,
				photos: product.skus && product.skus.photos ? product.skus.photos : product.photos,
				shortDesc: product.skus && product.skus.shortDesc ? product.skus.shortDesc : product.shortDesc,
				description: product.skus && product.skus.description ? product.skus.description : product.description,
				attrs: attrsMappingObj.attrs,
				skus: _.isObject(product.skus) ? product.skus : {},
				isActive: product.isActive,
				createDate: product.createDate,
				createdAt: product.createdAt,
				createBy: product.createBy,
				updateDate: product.updateDate,
				updatedAt: product.updatedAt,
				updateBy: product.updateBy,
				fullTextSearch: {
					name: product.skus && product.skus.sku ? product.skus.name : product.name,
					club: attrsMappingObj.attrs.club
					&& attrsMappingObj.attrs.club.values
					&& attrsMappingObj.attrs.club.values.length > 0 ? attrsMappingObj.attrs.club.values[0].name : null,
					groupService: attrsMappingObj.attrs.groupService
					&& attrsMappingObj.attrs.groupService.values
					&& attrsMappingObj.attrs.groupService.values.length > 0
						? attrsMappingObj.attrs.groupService.values[0].name : null,
				}
			};
			productInfo.fullTextSearch.address = attrsMappingObj.attrs.club
				? FunctionHelper.getFullTextAddressByLocation(attrsMappingObj.dataOfEntityByName) : "";
			listProductSync.push(productInfo);
			return product;
		});
		return listProductSync;
	}

	mapSyncDataEsForFab(listProducts) {
		if (!listProducts || !_.isArray(listProducts) || listProducts.length < 0) {
			return [];
		}
		const listProductSync = [];
		listProducts.map((product) => {
			const attrsMappingObj = this.processingAttributesTrans(
				product.attrs, product.listAttrKey, product.listEnt, "branch"
			);
			const productInfo = {
				pid: product._id ? product._id.toString() : "",
				id: product.skus && product.skus.sku ? product.skus.sku : product._id,
				productCode: product.productCode || "",
				name: product.skus && product.skus.sku ? product.skus.name : product.name,
				templateId: product.templateId,
				templateName: product.template ? product.template.name : "",
				price: product.skus && product.skus.price ? product.skus.price : product.price,
				quantity: product.skus && product.skus.quantity ? product.skus.quantity : product.quantity,
				img: product.skus && product.skus.img ? product.skus.img : product.img,
				photos: product.skus && product.skus.photos ? product.skus.photos : product.photos,
				shortDesc: product.skus && product.skus.shortDesc ? product.skus.shortDesc : product.shortDesc,
				description: product.skus && product.skus.description ? product.skus.description : product.description,
				attrs: attrsMappingObj.attrs,
				skus: _.isObject(product.skus) ? product.skus : {},
				isActive: product.isActive,
				createDate: product.createDate,
				createdAt: product.createdAt,
				createBy: product.createBy,
				updateDate: product.updateDate,
				updatedAt: product.updatedAt,
				updateBy: product.updateBy,
				fullTextSearch: {
					name: product.skus && product.skus.sku ? product.skus.name : product.name,
					branch: attrsMappingObj.attrs.branch
					&& attrsMappingObj.attrs.branch.values
					&& attrsMappingObj.attrs.branch.values.length > 0 ? attrsMappingObj.attrs.branch.values[0].name : null,
					cateBranch: attrsMappingObj.attrs.cateBranch
					&& attrsMappingObj.attrs.cateBranch.values
					&& attrsMappingObj.attrs.cateBranch.values.length > 0
						? attrsMappingObj.attrs.cateBranch.values[0].name : null,
					cateFood: attrsMappingObj.attrs.cateFood
					&& attrsMappingObj.attrs.cateFood.values
					&& attrsMappingObj.attrs.cateFood.values.length > 0 ? attrsMappingObj.attrs.cateFood.values[0].name : null,
				}
			};
			productInfo.fullTextSearch.address = attrsMappingObj.attrs.club
				? FunctionHelper.getFullTextAddressByLocation(attrsMappingObj.dataOfEntityByName) : "";
			listProductSync.push(productInfo);
			return product;
		});
		return listProductSync;
	}

	mapSyncDataEsForEcm(listProducts) {
		if (!listProducts || !_.isArray(listProducts) || listProducts.length < 0) {
			return [];
		}
		const listProductSync = [];
		listProducts.map((product) => {
			const attrsMappingObj = this.processingAttributesTrans(
				product.attrs, product.listAttrKey, product.listEnt, "store"
			);
			const productInfo = {
				pid: product._id ? product._id.toString() : "",
				id: product.skus && product.skus.sku ? product.skus.sku : product._id,
				productCode: product.productCode || "",
				name: product.skus && product.skus.sku ? product.skus.name : product.name,
				templateId: product.templateId,
				templateName: product.template ? product.template.name : "",
				price: product.skus && product.skus.price ? product.skus.price : product.price,
				quantity: product.skus && product.skus.quantity ? product.skus.quantity : product.quantity,
				img: product.skus && product.skus.img ? product.skus.img : product.img,
				photos: product.skus && product.skus.photos ? product.skus.photos : product.photos,
				shortDesc: product.skus && product.skus.shortDesc ? product.skus.shortDesc : product.shortDesc,
				description: product.skus && product.skus.description ? product.skus.description : product.description,
				attrs: attrsMappingObj.attrs,
				skus: _.isObject(product.skus) ? product.skus : {},
				isActive: product.isActive,
				createDate: product.createDate,
				createdAt: product.createdAt,
				createBy: product.createBy,
				updateDate: product.updateDate,
				updatedAt: product.updatedAt,
				updateBy: product.updateBy,
				fullTextSearch: {
					name: product.skus && product.skus.sku ? product.skus.name : product.name,
					manufacturer: attrsMappingObj.attrs.manufacturer
					&& attrsMappingObj.attrs.manufacturer.values
					&& attrsMappingObj.attrs.manufacturer.values.length > 0
						? attrsMappingObj.attrs.manufacturer.values[0].name : null,
					category: attrsMappingObj.attrs.category
					&& attrsMappingObj.attrs.category.values
					&& attrsMappingObj.attrs.category.values.length > 0
						? attrsMappingObj.attrs.category.values[0].name : null,
					store: attrsMappingObj.attrs.store
					&& attrsMappingObj.attrs.store.values
					&& attrsMappingObj.attrs.store.values.length > 0 ? attrsMappingObj.attrs.store.values[0].name : null,
				}
			};
			productInfo.fullTextSearch.address = attrsMappingObj.attrs.store
				? FunctionHelper.getFullTextAddressByLocation(attrsMappingObj.dataOfEntityByName) : "";
			listProductSync.push(productInfo);
			return product;
		});
		return listProductSync;
	}

	processDataSyncToEs(listProduct, indexEs) {
		indexEs = parseInt(indexEs, 10);
		switch (indexEs) {
			case 1:
				return this.mapSyncDataEsForRealEstate(listProduct);
			case 2:
				return this.mapSyncDataEsForCitiGym(listProduct);
			case 3:
				return this.mapSyncDataEsForFab(listProduct);
			case 4:
				return this.mapSyncDataEsForEcm(listProduct);
			default:
				return [];
		}
	}
}

module.exports = ProductDto;
