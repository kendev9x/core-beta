const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, FunctionHelper, ResponseHelper } = require("../../../../libs/helpers");
const { ProductDto } = require("../io/transfer");
const BaseLogic = require("./base.logic");
const ProductFilterLogic = require("./product-filter.logic");
const EntityLogic = require("./entity.logic");
const ProductCustomerLogic = require("./product-customer.logic");
const {ElasticSearch} = require("../../../../connectors");
const SqlDriver = require("mssql");
const SqlDb = require("../dbHandler/sqlDb");

class ProductLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.industryModel = this.models.IndustryModel;
		this.productModel = this.models.ProductModel;
		this.productTemplateModel = this.models.ProductTemplateModel;
		this.productCustomerModel = this.models.ProductCustomerModel;
		this.entityModel = this.models.EntityModel;
		this.productFilterLogic = new ProductFilterLogic(mainProcess);
		this.entityLogic = new EntityLogic(mainProcess);
		this.productCustomerLogic = new ProductCustomerLogic(mainProcess);
		this.elasticSearch = new ElasticSearch(mainProcess);
		this.sqlDB = new SqlDb(mainProcess);
	}

	/** GET LIST PRODUCT PAGING: PAGE NUMBER, PAGE SIZE
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const { filter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, true, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.productModel.listPaging(filter, sort, params.pageNumber, params.pageSize);
		if (result && result.docs.length > 0) {
			const templateIds = result.docs.map((x) => x.templateId);
			const listTemplate = await this.productTemplateModel.getAll({_id: {$in: templateIds}});
			result.docs.map((product) => {
				product.template = listTemplate.find((x) => x._id.toString() === product.templateId);
				return product;
			});
		}
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST PRODUCT PAGING: SKIP, LIMIT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async list(context) {
		const params = super.getParamsByMethodType(context);
		const { filter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, false, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		let result = [];
		if (params.skip && params.limit) {
			result = await this.productModel.list(filter, sort, params.skip, params.limit);
		} else {
			result = await this.productModel.getAll(filter, sort);
		}
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST PRODUCT SKU: SKIP, LIMIT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listSku(context) {
		const params = super.getParamsByMethodType(context);
		const { filter, skuFilter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, false, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.productModel.listPopulateSkuPaging(filter, skuFilter, sort, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST PRODUCT SHOWCASE SKU: SKIP, LIMIT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listShowcase(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const { filter, skuFilter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, false, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.productModel.listShowcase(filter, skuFilter, sort, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST PRODUCT SHOWCASE PAGINATION: PAGE NUMBER, PAGE SIZE
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listShowcasePaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		const { filter, skuFilter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, false, params.industry);
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		const result = await this.productModel.listShowcasePaging(filter, skuFilter, sort, params.pageNumber, params.pageSize);
		if (result.docs && result.docs.length > 0) {
			result.docs = await this.mappingToEntity(context, result.docs);
			result.docs = new ProductDto(langCode).mappingListSku(result.docs);
		}
		return ResponseHelper.resInfo(result);
	}

	/** POST SEARCH PRODUCT ON ELASTIC
	 * @param context
	 * @output object: {code, data, message}
	 */
	async searchProduct(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		/** params.indexEs = 1: BDS, 2: CITY GYM, 3: F&B */
		if (!params.indexEs || !_.isNumber(params.indexEs)) {
			return ResponseHelper.resFailed(this.MESSAGE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		if (!params.industry) {
			switch (params.indexEs) {
				case 1:
					params.industry = "bds";
					break;
				case 2:
					params.industry = "ctg";
					break;
				case 3:
					params.industry = "fab";
					break;
				case 4:
					params.industry = "ecm";
					break;
				default:
					params.industry = "bds";
			}
		}
		const query = await this.productFilterLogic
			.getBuildSearchProductOnEsByIndustry(context, params.industry);
		const sortArr = [];
		if (params.sortBy && params.sortType) {
			const sort = {};
			let sortType = parseInt(params.sortType, 10);
			sortType = sortType === 1 ? "asc" : "desc";
			sort[`${params.sortBy}`] = {
				order: sortType
			};
			sortArr.push(sort);
		}
		sortArr.push({createdAt: {order: "desc"}});
		const result = await this.elasticSearch.searchProduct(params.indexEs, query, sortArr, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** GET PRODUCT DETAIL
	 * @param context
	 * @output object: {code, data, message}
	 */
	async getDetailById(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const result = await this.productModel.getById(FunctionHelper.convertToMongoId(params.id));
		return ResponseHelper.resInfo(result);
	}

	/** GET PRODUCT SKU DETAIL
	 * @param context
	 * @output object: {code, data, message}
	 */
	async getDetailForSku(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.sku) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const result = await this.productModel.listPopulateSku(
			{isActive: true, isDelete: false},
			{"skus.sku": context.params.params.sku, isActive: true}
		);
		const data = result && result.length > 0 ? result[0] : result;
		return ResponseHelper.resInfo(data);
	}

	/** GET LIST PRODUCT VIEWED BY CUSTOMER PAGING: TAKE, LIMIT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listProductViewed(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const customer = RequestHelper.getCurrentAccount(context);
		if (!customer || !customer.userId) {
			return ResponseHelper.resInfo([]);
		}
		/** Get data product of customer */
		const productCustomerObj = await this.productCustomerLogic.funcGetProductForCustomer(customer.userId);
		if (FunctionHelper.isEmpty(productCustomerObj) || FunctionHelper.isEmpty(productCustomerObj.productViews)) {
			return ResponseHelper.resInfo([]);
		}
		const listProductView = productCustomerObj.productViews.map((x) => x._doc);
		/** Create query default */
		const query = {
			filter: {
				$and: [
					{isDelete: false},
					{isActive: true},
				]
			},
			skuFilter: {
				$and: [
					{"skus.isActive": true},
					{"skus.isShowcase": true}
				]
			}
		};
		let {filter} = query;
		let {skuFilter} = query;
		/** If have industry get build query by industry */
		if (params.industry) {
			const queryObj = await this.productFilterLogic
				.getBuildSearchProductByIndustry(context, false, params.industry);
			filter = queryObj.filter;
			skuFilter = queryObj.skuFilter;
		}
		/** Build query with data product of customer */
		const listProductIdViewed = FunctionHelper.convertToMongoId(listProductView.map((product) => product.id));
		const listSkuViewed = listProductView
			.filter((product) => !_.isEmpty(product.sku)).map((x) => x.sku);
		filter.$and.push({_id: {$in: listProductIdViewed}});
		if (listSkuViewed && listSkuViewed.length > 0) {
			skuFilter.$and.push({"skus.sku": {$in: listSkuViewed}});
		}
		/** Implement for sorting data */
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		/** Exec get data product of customer */
		const result = await this.productModel.listShowcase(filter, skuFilter, sort, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** GET LIST PRODUCT FAVORITE BY CUSTOMER PAGING: TAKE, LIMIT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listProductFavorite(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const customer = RequestHelper.getCurrentAccount(context);
		if (!customer || !customer.userId) {
			return ResponseHelper.resInfo([]);
		}
		/** Get data product of customer */
		const productCustomerObj = await this.productCustomerLogic.funcGetProductForCustomer(customer.userId);
		if (FunctionHelper.isEmpty(productCustomerObj) || FunctionHelper.isEmpty(productCustomerObj.productFavorites)) {
			return ResponseHelper.resInfo([]);
		}
		const listProductFavorite = productCustomerObj.productFavorites.map((x) => x._doc);
		/** Create query default */
		const query = {
			filter: {
				$and: [
					{isDelete: false},
					{isActive: true},
				]
			},
			skuFilter: {
				$and: [
					{"skus.isActive": true},
					{"skus.isShowcase": true}
				]
			}
		};
		let {filter} = query;
		let {skuFilter} = query;
		/** If have industry get build query by industry */
		if (params.industry) {
			const queryObj = await this.productFilterLogic
				.getBuildSearchProductByIndustry(context, false, params.industry);
			filter = queryObj.filter;
			skuFilter = queryObj.skuFilter;
		}
		/** Build query with data product of customer */
		const listProductIdFavorite = FunctionHelper.convertToMongoId(listProductFavorite.map((product) => product.id));
		const listSkuFavorite = listProductFavorite
			.filter((product) => !_.isEmpty(product.sku)).map((x) => x.sku);
		filter.$and.push({_id: {$in: listProductIdFavorite}});
		if (listSkuFavorite && listSkuFavorite.length > 0) {
			skuFilter.$and.push({"skus.sku": {$in: listSkuFavorite}});
		}
		/** Implement for sorting data */
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		/** Exec get data product of customer */
		const result = await this.productModel.listShowcase(filter, skuFilter, sort, params.skip, params.limit);
		return ResponseHelper.resInfo(result);
	}

	/** POST CREATE A PRODUCT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async create(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.name || (typeof params.name !== "object" && Object.keys(params.name).length < 1)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_NAME,null, langCode);
		}
		if (params.price && (!_.isNumber(params.price) || params.price < 0)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_PRICE,null, langCode);
		}
		if (params.quantity && (!_.isNumber(params.quantity) || params.quantity < 0)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_QUANTITY,null, langCode);
		}
		if (!params.templateId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_TEMPLATE,null, langCode);
		}
		if (!params.templateRev) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_TEMPLATE_REVISION,null, langCode);
		}
		const queryCheckExistName = await super.buildFilterCheckExist(params.name, "name", params.industry);
		const resultCheck = await this.productModel.getAll(queryCheckExistName);
		if (resultCheck && resultCheck.length > 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.EXIST_NAME);
		}
		if (params.attrs && params.attrs.length > 0) {
			params.attrs.map((attr) => {
				attr.type = attr.type.toUpperCase();
				return attr;
			});
		}
		params.searchInfo = this.createSearchingObject({name: params.name, skus: []});
		if (params.skus) {
			const checkFailedSkus = [];
			params.skus.map((sku) => {
				if (sku.price && (!_.isNumber(sku.price) || sku.price < 0)) {
					checkFailedSkus.push(`${ResCode.BIZ_STATUS_CODE.PRODUCT.INVALID_PRICE.MESSAGE} for ${sku.name}`);
				}
				if (sku.quantity && (!_.isNumber(sku.quantity) || sku.quantity < 0)) {
					checkFailedSkus.push(`${ResCode.BIZ_STATUS_CODE.PRODUCT.INVALID_QUANTITY.MESSAGE} for ${sku.name}`);
				}
				const skuSearchInfo = {
					name: this.createSearchingObject(sku.name)
				};
				params.searchInfo.skus.push(skuSearchInfo);
				return sku;
			});
			if (checkFailedSkus.length > 0) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, checkFailedSkus, langCode);
			}
		}
		const accountObj = RequestHelper.getCurrentAccount(context);
		params.createBy = accountObj.userName;
		const result = await this.productModel.create(params);
		if (result && result._id) {
			this.funcCreateProductToElastic(context, result).then((r) => r);
		}
		return ResponseHelper.resInfo(result);
	}

	/** PUT UPDATE A PRODUCT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async update(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM,null, langCode);
		}
		if (!params.name || (typeof params.name !== "object" && Object.keys(params.name).length < 1)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_NAME,null, langCode);
		}
		if (params.price && (!_.isNumber(params.price) || params.price < 0)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_PRICE,null, langCode);
		}
		if (params.quantity && (!_.isNumber(params.quantity) || params.quantity < 0)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_QUANTITY,null, langCode);
		}
		if (!params.templateId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM_TEMPLATE,null, langCode);
		}
		if (!params.templateRev) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_TEMPLATE_REVISION,null, langCode);
		}
		const queryCheckExistName = await super.buildFilterCheckExist(params.name, "name", params.industry);
		const resultCheck = await this.productModel.getAll(queryCheckExistName);
		if (resultCheck && resultCheck.length > 1 && resultCheck[0]._id.toString() !== params._id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.EXIST_NAME,null, langCode);
		}
		if (params.attrs && params.attrs.length > 0) {
			params.attrs.map((attr) => {
				attr.type = attr.type.toUpperCase();
				return attr;
			});
		}
		params.searchInfo = this.createSearchingObject({name: params.name, skus: []});
		if (params.skus) {
			const checkFailedSkus = [];
			params.skus.map((sku) => {
				if (sku.price && (!_.isNumber(sku.price) || sku.price < 0)) {
					checkFailedSkus.push(`${ResCode.BIZ_STATUS_CODE.PRODUCT.INVALID_PRICE.MESSAGE} for ${sku.name}`);
				}
				if (sku.quantity && (!_.isNumber(sku.quantity) || sku.quantity < 0)) {
					checkFailedSkus.push(`${ResCode.BIZ_STATUS_CODE.PRODUCT.INVALID_QUANTITY.MESSAGE} for ${sku.name}`);
				}
				const skuSearchInfo = {
					name: this.createSearchingObject(sku.name)
				};
				params.searchInfo.skus.push(skuSearchInfo);
				return sku;
			});
			if (checkFailedSkus.length > 0) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, checkFailedSkus, langCode);
			}
		}
		const accountObj = RequestHelper.getCurrentAccount(context);
		params.updateBy = accountObj.userName;
		const result = await this.productModel.update(params);
		if (result && result.ok > 0 && result.nModified > 0) {
			const productInfo = await this.productModel.getById(params._id);
			this.funcUpdateProductToElastic(context, productInfo).then((r) => r);
		}
		return ResponseHelper.resInfo(result);
	}

	/** POST CHECK PRODUCT EXIST OR NOT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async checkExist(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params.value || !params.fieldName || !params.industry) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM,null, langCode);
		}
		const queryCheckExistName = await super.buildFilterCheckExist(params.value, params.fieldName, params.industry);
		const resultCheck = await this.productModel.getAll(queryCheckExistName);
		if (resultCheck && resultCheck.length > 0) {
			return ResponseHelper.resInfo(true);
		}
		return ResponseHelper.resInfo(false);
	}

	/** POST GENERATE LIST SKUS
	 * @param context
	 * @output object: {code, data, message}
	 */
	async generateSkus(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.skuAttrs || params.skuAttrs.length < 1) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const skuGens = super.genSkus(params.skuAttrs, langCode);
		if (!skuGens || skuGens.length < 1) {
			return [];
		}
		const skus = [];
		skuGens.skus.map((sku) => {
			skus.push({
				name: sku.genName,
				attrs: this.genericObjectFromArray(sku.values, this.getLanguageCode(context)),
				sku: this.buildSkuCodeUnique(),
				price: 0,
				img: "",
				photos: [],
				quantity: 0,
				shortDesc: {},
				description: {},
				isActive: false,
			});
			return sku;
		});
		const result = {total: skuGens.totalSku, skus};
		return ResponseHelper.resInfo(result);
	}

	/** POST SET IS ACTIVE A PRODUCT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async setIsActive(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params._id || params.isActive == null) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const productInfo = await this.productModel.getById(params._id);
		if (!productInfo) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		const result = await this.productModel.setIsActive(params._id, params.isActive);
		if (result && result.ok > 0) {
			this.funcUpdateProductToElastic(context, productInfo).then((r) => r);
		}
		return ResponseHelper.resInfo(result);
	}

	/** POST SET IS DELETE A PRODUCT
	 * @param context
	 * @output object: {code, data, message}
	 */
	async setIsDelete(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params || !params._id || !params.isDelete) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const productInfo = await this.productModel.getById(params._id);
		if (!productInfo || FunctionHelper.isEmpty(productInfo)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		const result = await this.productModel.setIsDelete(params._id, params.isDelete);
		if (result && result.ok > 0) {
			/** Sync to elastic */
			this.funcRemoveProductItemToElastic(context, productInfo).then((r) => r);
		}
		return ResponseHelper.resInfo(result);
	}

	/** POST SET IS ACTIVE FOR A PRODUCT SKU
	 * @param context
	 * @output object: {code, data, message}
	 */
	async setIsActiveForSku(context) {
		const langCode = RequestHelper.getLanguageCode(context);
		const params = RequestHelper.getParamsByMethodType(context);
		if (!params || !params._id || !params.isActive) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const result = await this.productModel.setIsActiveSku(params._id, params.sku, params.isActive);
		if (result && result.ok > 0) {
			const productInfo = await this.productModel.getById(params._id);
			this.funcUpdateProductToElastic(context, productInfo).then((r) => r);
		}
		return ResponseHelper.resInfo(result);
	}

	/** POST GET LIST PRODUCT BY LIST ID
	 * @param context
	 * @output object: {code, data, message}
	 */
	async getListProductByListId(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.ids || !Array.isArray(params.ids)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const listId = params.ids.map((item) => FunctionHelper.convertToMongoId(item));
		const filter = {
			_id: {$in: listId},
			isActive: true,
			isDelete: false,
		};
		let result = await this.productModel.getAll(filter);
		return ResponseHelper.resInfo(result);
	}

	/** POST GET LIST PRODUCT BY LIST sku
	 * @param context
	 * @output object: {code, data, message}
	 */
	async getListProductByListSku(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.skus || !Array.isArray(params.skus)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const filter = {
			"skus.sku": {$in: params.skus},
			isActive: true,
			isDelete: false,
		};
		let result = await this.productModel.listPopulateSku(filter, {isActive: true}, {});
		return ResponseHelper.resInfo(result);
	}

	/** POST RE-SYNC DATA PRODUCTS TO ELASTIC
	 * @param context
	 * @output object: {code, data, message}
	 */
	async reSyncProductToElastic(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		/** params.indexEs = 1: BDS, 2: CITY GYM, 3: F&B */
		if (!params.indexEs || !_.isNumber(params.indexEs)) {
			return false;
		}
		await this.elasticSearch.deleteAll(params.indexEs);
		const { filter, skuFilter } = await this.productFilterLogic
			.getBuildSearchProductByIndustry(context, false, params.industry);
		/** Process get all product via industry sync manual to elastic
		 * -- this action not publish only dev used when urgent sync */
		let products = await this.product.listShowcase(filter, skuFilter, {createdAt: 1}, 0, Number.MAX_SAFE_INTEGER);
		if (products && products.length < 1) {
			return false;
		}
		products = await Promise.all(products.map(async (result) => {
			let listEntId = [];
			let listEnt = [];
			const attrKeys = Object.keys(result.attrs);
			attrKeys.map((key) => {
				if (result.attrs[key].type.toUpperCase() === "PLENT") {
					listEntId = [...listEntId, ...result.attrs[key].values];
				}
				return key;
			});
			if (listEntId.length > 0) {
				listEnt = await this.entityLogic.funcGetListEntity(context, listEntId);
			}
			result.listEnt = listEnt;
			result.listAttrKey = attrKeys;
			return result;
		}));
		const productSync = new ProductDto(langCode).processDataSyncToEs(products, params.indexEs);
		const result = await this.elasticSearch.syncProduct(productSync, params.indexEs);
		return ResponseHelper.resInfo(result);
	}

	async filterResourceConfig(context) {
		/** TODO: Implement Filter Resource Config */
		return false;
	}

	/** POST GET LIST PRODUCT VIEWED WITH PAGINATION: PAGE NUMBER, PAGE SIZE
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listProductViewedPaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.customerId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		/** Get data product of customer */
		const productCustomerObj = await this.productCustomerLogic.funcGetProductForCustomer(params.customerId);
		if (_.isEmpty(productCustomerObj) || _.isEmpty(productCustomerObj.productViews)) {
			return ResponseHelper.resInfo([]);
		}
		const listProductView = productCustomerObj.productViews.map((x) => x._doc);
		/** Create query default */
		const query = {
			filter: {
				$and: [
					{isDelete: false}
				]
			},
			skuFilter: {
				$and: [
					{"skus.isActive": true},
					{"skus.isShowcase": true}
				]
			}
		};
		let {filter} = query;
		let {skuFilter} = query;
		/** If have industry get build query by industry */
		if (params.industry) {
			const queryObj = await this.productFilterLogic
				.getBuildSearchProductByIndustry(context, false, params.industry);
			filter = queryObj.filter;
			skuFilter = queryObj.skuFilter;
		}
		/** Build query with data product of customer */
		const listProductIdViewed = FunctionHelper.convertToMongoId(listProductView.map((product) => product.id));
		const listSkuViewed = listProductView
			.filter((product) => !_.isEmpty(product.sku)).map((x) => x.sku);
		filter.$and.push({_id: {$in: listProductIdViewed}});
		skuFilter.$and.push({"skus.sku": {$in: listSkuViewed}});
		/** Implement for sorting data */
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		/** Exec get data product of customer */
		const result = await this.productModel.listShowcase(filter, skuFilter, sort, params.pageNumber, params.pageSize);
		return ResponseHelper.resInfo(result);
	}

	/** POST GET LIST PRODUCT FAVORITE WITH PAGINATION: PAGE NUMBER, PAGE SIZE
	 * @param context
	 * @output object: {code, data, message}
	 */
	async listProductFavoritePaging(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params.customerId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		/** Get data product of customer */
		const productCustomerObj = await this.productCustomerLogic.funcGetProductForCustomer(params.customerId);
		if (FunctionHelper.isEmpty(productCustomerObj) || FunctionHelper.isEmpty(productCustomerObj.productFavorites)) {
			return ResponseHelper.resInfo([]);
		}
		const listProductFavorite = productCustomerObj.productFavorites.map((x) => x._doc);
		/** Create query default */
		const query = {
			filter: {
				$and: [
					{isDelete: false}
				]
			},
			skuFilter: {
				$and: [
					{"skus.isActive": true},
					{"skus.isShowcase": true}
				]
			}
		};
		let {filter} = query;
		let {skuFilter} = query;
		/** If have industry get build query by industry */
		if (params.industry) {
			const queryObj = await this.productFilterLogic
				.getBuildSearchProductByIndustry(context, false, params.industry);
			filter = queryObj.filter;
			skuFilter = queryObj.skuFilter;
		}
		/** Build query with data product of customer */
		const listProductIdFavorite = FunctionHelper.convertToMongoId(listProductFavorite.map((product) => product.sku));
		const listSkuViewed = listProductFavorite
			.filter((product) => !_.isEmpty(product.sku));
		filter.$and.push({_id: {$in: listProductIdFavorite}});
		skuFilter.$and.push({"skus.sku": {$in: listSkuViewed}});
		/** Implement for sorting data */
		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		sort.createdAt = -1;
		/** Exec get data product of customer */
		const result = await this.productModel.listShowcase(filter, skuFilter, sort, params.pageNumber, params.pageSize);
		return ResponseHelper.resInfo(result);
	}

	/** POST ADD PRODUCT ATTRIBUTE TO A PRODUCT ITEM
	 * @param context
	 * @output object: {code, data, message}
	 */
	async addAttrsProduct(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params._id || FunctionHelper.isEmpty(params.attrs)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const productObj = await this.productModel.getById(params._id);
		if (FunctionHelper.isEmpty(productObj)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		/** If params is object so add it to array then process */
		let attrs = [];
		if (_.isObject(params.attrs) && !_.isArray(params.attrs)) {
			attrs.push(params.attrs);
		} else {
			attrs = [...attrs, ...params.attrs];
		}
		/** Set attribute to product */
		attrs.map((attrParamObj) => {
			productObj.attrs[attrParamObj.key] = {
				name: `m${_.keys(productObj.attrs).length + 1}`,
				label: attrParamObj.label,
				isFilter: true,
				unit: attrParamObj.unit,
				type: attrParamObj.type.toUpperCase(),
				values: attrParamObj.values
			};
			return attrParamObj;
		});
		/** Update product */
		const isUpdate = await this.productModel.update(productObj);
		return ResponseHelper.resInfo(isUpdate.nModified > 0);
	}

	/** POST REMOVE PRODUCT ATTRIBUTE TO A PRODUCT ITEM
	 * @param context
	 * @output object: {code, data, message}
	 */
	async removeAttrsProduct(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params._id || FunctionHelper.isEmpty(params.key)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const productObj = await this.productModel.getById(params._id);
		if (FunctionHelper.isEmpty(productObj)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		const keyAttrs = _.keys(productObj.attrs);
		if (keyAttrs.findIndex((x) => x.toUpperCase() === params.key.toUpperCase()) < 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ATTRIBUTE_NOT_EXIST, null, langCode);
		}
		/** Remove attribute */
		delete productObj.attrs[params.key];
		/** Update product */
		const isUpdate = await this.productModel.update(productObj);
		return ResponseHelper.resInfo(isUpdate.nModified > 0);
	}

	/** POST SET A PRODUCT ATTRIBUTE TO A PRODUCT ITEM
	 * @param context
	 * @output object: {code, data, message}
	 */
	async setAttrsValue(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		if (!params._id || _.isEmpty(params.key) || _.isNull(params.values)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const productObj = await this.productModel.getById(params._id);
		if (FunctionHelper.isEmpty(productObj)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ITEM_NOT_FOUND, null, langCode);
		}
		const keyAttrs = _.keys(productObj.attrs);
		if (keyAttrs.findIndex((x) => x.toUpperCase() === params.key.toUpperCase()) < 0) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.ATTRIBUTE_NOT_EXIST, null, langCode);
		}
		productObj.attrs[params.key].values = params.values;
		const result = await this.productModel.update(productObj);
		return ResponseHelper.resInfo(result.nModified > 0);
	}

	/** SQL TESTING */
	async getListDataSql(context) {
		try {
			const dbConnection = await this.sqlDB.createConnection();
			/** JUST USE FOR TESTING NOT USE THIS FOR PUBLISH */
			const result = await dbConnection.request().query("Select * from sample");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return ResponseHelper.resInfo(result.recordset);
			}
			return ResponseHelper.resInfo(result);
		} catch (e) {
			return ResponseHelper.resErr(506, "Processing Failed", 500);
		}
	}

	async getListDataSQLBySP(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.status) {
				return ResponseHelper.resErr(400, "Bad request", 400);
			}
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("status", SqlDriver.Int, params.status)
				.execute("GetDataSP");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return ResponseHelper.resInfo(result.recordset);
			}
			return ResponseHelper.resInfo(result);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}

	/** PRIVATE FUNCTIONS USE FOR PRODUCT LOGIC OR ANOTHER LOGICS AT SAME SERVICE */

	/** USE FOR SET IS DELETE A PRODUCT */
	async funcRemoveProductItemToElastic(context, productInfo) {
		const params = RequestHelper.getParamsByMethodType(context);
		const langCode = RequestHelper.getLanguageCode(context);
		let listEntId = [];
		let listEnt = [];
		const attrKeys = Object.keys(productInfo.attrs);
		attrKeys.map((key) => {
			if (productInfo.attrs[key].type.toUpperCase() === "PLENT") {
				listEntId = [...listEntId, ...productInfo.attrs[key].values];
			}
			return key;
		});
		if (productInfo.skus && productInfo.skus.length > 0) {
			productInfo.skus = productInfo.skus.filter((sku) => sku.isActive);
		}
		if (listEntId.length > 0) {
			listEnt = await this.entityLogic.funcGetListEntity(context, listEntId);
		}
		productInfo.listEnt = listEnt;
		productInfo.listAttrKey = attrKeys;
		const listProductSync = await this.productModel.listPopulateSku(
			{isDelete: false, isActive: true, _id: FunctionHelper.convertToMongoId(productInfo._id)},
			{ "skus.isActive": true, "skus.isShowcase": true }
		);
		const productTemplate = await this.productTemplateModel.getById(productInfo.templateId);
		const indexEs = await super.getIndexEsByIndustry(productTemplate.industry);
		if (listProductSync && listProductSync.length > 0) {
			listProductSync.map((product) => {
				product.industry = productTemplate.industry;
				product.listEnt = listEnt;
				product.listAttrKey = attrKeys;
				return product;
			});
			this.elasticSearch.deleteProduct(
				new ProductDto(langCode).processDataSyncToEs(listProductSync, indexEs), indexEs
			).then((r) => r);
		} else {
			params.industry = productTemplate.industry;
			this.elasticSearch.deleteProduct(
				new ProductDto(langCode).processDataSyncToEs([productInfo], indexEs), indexEs
			).then((r) => r);
		}
		return true;
	}

	/** USE UPDATE A PRODUCT */
	async funcUpdateProductToElastic(context, productUpdated) {
		const langCode = RequestHelper.getLanguageCode(context);
		let listEntId = [];
		let listEnt = [];
		const attrKeys = Object.keys(productUpdated.attrs);
		attrKeys.map((key) => {
			if (productUpdated.attrs[key].type.toUpperCase() === "PLENT") {
				listEntId = [...listEntId, ...productUpdated.attrs[key].values];
			}
			return key;
		});
		if (productUpdated.skus && productUpdated.skus.length > 0) {
			productUpdated.skus = productUpdated.skus.filter((sku) => sku.isActive);
		}
		if (listEntId.length > 0) {
			listEnt = await this.entityLogic.funcGetListEntity(context, listEntId);
		}
		productUpdated.listEnt = listEnt;
		productUpdated.listAttrKey = attrKeys;
		const listProductSync = await this.productModel.listPopulateSku(
			{isDelete: false, isActive: true, _id: FunctionHelper.convertToMongoId(productUpdated._id)},
			{ "skus.isActive": true, "skus.isShowcase": true }
		);
		const productTemplate = await this.productTemplateModel.getById(productUpdated.templateId);
		const indexEs = await super.getIndexEsByIndustry(productTemplate.industry);
		if (listProductSync && listProductSync.length > 0) {
			listProductSync.map((product) => {
				product.industry = productTemplate.industry;
				product.listEnt = listEnt;
				product.listAttrKey = attrKeys;
				return product;
			});
			this.elasticSearch.updateProduct(
				new ProductDto(langCode).processDataSyncToEs(listProductSync, indexEs), indexEs
			).then((r) => r);
		} else {
			productUpdated.industry = productTemplate.industry;
			this.elasticSearch.updateProduct(
				new ProductDto(langCode).processDataSyncToEs([productUpdated], indexEs), indexEs
			).then((r) => r);
		}
	}

	/** USE CREATE A PRODUCT */
	async funcCreateProductToElastic(context, productCreated) {
		let listEntId = [];
		let listEnt = [];
		const attrKeys = Object.keys(productCreated.attrs);
		attrKeys.map((key) => {
			if (productCreated.attrs[key].type.toUpperCase() === "PLENT") {
				listEntId = [...listEntId, ...productCreated.attrs[key].values];
			}
			return key;
		});
		if (listEntId.length > 0) {
			listEnt = await this.entityLogic.funcGetListEntity(context, listEntId);
		}
		productCreated.listEnt = listEnt;
		productCreated.listAttrKey = attrKeys;
		const listProductSync = await this.productModel.listPopulateSku(
			{isDelete: false, isActive: true, _id: FunctionHelper.convertToMongoId(productCreated._id)},
			{ "skus.isActive": true, "skus.isShowcase": true }
		);
		const productTemplate = await this.productTemplateModel.getById(productCreated.templateId);
		const indexEs = await super.getIndexEsByIndustry(productTemplate.industry);
		if (listProductSync && listProductSync.length > 0) {
			listProductSync.map((product) => {
				product.listEnt = listEnt;
				product.listAttrKey = attrKeys;
				product.industry = productTemplate.industry;
				return product;
			});
			await this.elasticSearch.syncProduct(
				new ProductDto(super.getLanguageCode(context)).processDataSyncToEs(listProductSync, indexEs), indexEs
			);
		} else {
			productCreated.industry = productTemplate.industry;
			await this.elasticSearch.syncProduct(
				new ProductDto(super.getLanguageCode(context)).processDataSyncToEs([productCreated], indexEs), indexEs
			);
		}
		return true;
	}
}

module.exports = ProductLogic;
