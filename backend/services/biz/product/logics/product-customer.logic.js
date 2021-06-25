const _ = require("lodash");
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, FunctionHelper, ResponseHelper } = require("../../../../libs/helpers");
const BaseLogic = require("./base.logic");
const ProductFilterLogic = require("./product-filter.logic");

class ProductCustomerLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.industryModel = this.models.IndustryModel;
		this.productModel = this.models.ProductModel;
		this.productCustomerModel = this.models.ProductCustomerModel;
		this.productFilterLogic = new ProductFilterLogic(mainProcess);
	}

	/** Save favorite product. This function need customer authorization
	 * @param ctx
	 * Params: id - product id (required), sku - product sku (optional)
	 * @output @output object: {code, data, message} */
	async saveProductFavorite(ctx) {
		const langCode = RequestHelper.getLanguageCode(ctx);
		const params = RequestHelper.getParamsByMethodType(ctx);
		const customer = RequestHelper.getCurrentAccount(ctx);
		if (!params._id || !customer || !customer.userId) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.PRODUCT.MISSING_PARAM, null, langCode);
		}
		const customerId = customer.userId.toString();
		params.sku = !params.sku ? "" : params.sku;
		const productCustomer = await this.productCustomerModel.findOne({customerId});
		if (FunctionHelper.isEmpty(productCustomer)) {
			/** Customer have not data ==> Create new record tracking for this customer */
			const productCustomerCreate = {
				customerId: customer.userId.toString(),
				productFavorites: [{
					id: params._id,
					sku: params.sku
				}],
				productViews: []
			};
			const isAdd = await this.productCustomerModel.create(productCustomerCreate);
			const result = {
				isSave: isAdd && isAdd._id,
			};
			return ResponseHelper.resInfo(result);
		}
		if (!productCustomer.productFavorites || FunctionHelper.isEmpty(productCustomer.productFavorites)) {
			/** Customer have data tracking but product favorites is empty */
			productCustomer.productFavorites = [{
				id: params._id,
				sku: params.sku
			}];
			const isSave = await this.productCustomerModel.update(productCustomer);
			const result = {
				isSave: isSave.nModified > 0
			};
			return ResponseHelper.resInfo(result);
		}
		const productFavoriteExisted = productCustomer.productFavorites
			.findIndex((favorite) => favorite.id === params._id && favorite.sku === params.sku);
		if (productFavoriteExisted >= 0) {
			/** Product favorite existed ===> this action is meaning remove this product from favorites product */
			const isSave = await this.productCustomerModel.updateSet(
				{customerId},
				{
					$pull: {productFavorites: {id: params._id, sku: params.sku}}
				}
			);
			const result = {
				isRemove: isSave.nModified > 0
			};
			return ResponseHelper.resInfo(result);
		}
		/** Add product to list favorite product */
		productCustomer.productFavorites.push({id: params._id, sku: params.sku});
		const isSave = await this.productCustomerModel.update(productCustomer);
		const result = {
			isSave: isSave.nModified > 0
		};
		return ResponseHelper.resInfo(result);
	}

	/** Get data product sorting via highest view by all customer
	 * @param ctx
	 * @output @output object: {code, data, message} */
	async getReportProductViewed(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const sort = { count: -1 };
		let result = [];
		if (params.dateFr && params.dateTo) {
			/** Get data viewed products of all customer with filter params  */
			const dateFr = FunctionHelper.convertToDate(params.dateFr);
			const dateTo = FunctionHelper.convertToDate(params.dateTo);
			if (dateFr && dateTo) {
				params.dateFr = dateFr.setHours(0, 0, 0, 0);
				params.dateTo = dateTo.setHours(24, 59, 59, 999);
				const filter = {
					"productFavorites.date": {
						$gte: new Date(params.dateFr),
						$lte: new Date(params.dateTo)
					}
				};
				result = await this.productCustomerModel.getListProductViewedSorting(filter, {count: -1});
			}
		} else {
			/** Get data viewed products of all customer without filter params  */
			result = await this.productCustomerModel.getListProductViewedSorting({}, {count: -1});
		}
		if (!result || FunctionHelper.isEmpty(result)) {
			return ResponseHelper.resInfo(result);
		}
		/** Process viewed products id and sku  */
		const listProductViewed = result;
		const listProductId = FunctionHelper.convertToMongoId(result.map((x) => x._id.productId));
		const listProductSku = [];
		result.map((x) => {
			if (_.isEmpty(x._id.sku) || listProductSku.findIndex((sku) => sku === x._id.sku) >= 0) {
				return x;
			}
			listProductSku.push(x._id.sku);
			return x;
		});
		/** Build filter for products from data viewed products id and sku  */
		let productFilter = {
			filter: {_id: {$in: listProductId}},
			skuFilter: {"skus.sku": {$in: listProductSku}}
		};
		if (params.industry) {
			const { filter, skuFilter } = await this.productFilterLogic
				.getBuildSearchProductByIndustry(ctx, true, params.industry);
			productFilter = {
				filter: {...filter, _id: {$in: listProductId}},
				skuFilter: {...skuFilter, "skus.sku": {$in: listProductSku}}
			};
		}
		/** Get data */
		const products = await this.productModel.listShowcasePaging(productFilter.filter, productFilter.skuFilter,
			sort, params.pageNumber, params.pageSize);
		if (!products || _.isEmpty(products.docs)) {
			return ResponseHelper.resInfo(products);
		}
		/** Return product data */
		products.docs = products.docs.map((product) => {
			const itemReturn = {
				_id: product._id,
				productCode: product.productCode,
				sku: product.skus && product.skus.sku ? product.skus.sku : "",
				name: product.skus && product.skus.sku ? product.skus.name : product.name,
				price: product.skus && product.skus.price ? product.skus.price : product.price,
				quantity: product.skus && product.skus.quantity ? product.skus.quantity : product.quantity,
				img: product.skus && product.skus.img ? product.skus.img : product.img,
				isActive: product.isActive
			};
			const productViewed = listProductViewed
				.find((k) => k._id.productId.toString() === itemReturn._id.toString() && k._id.sku === itemReturn.sku);
			if (!productViewed || _.isEmpty(productViewed)) {
				return itemReturn;
			}
			itemReturn.count = productViewed.count;
			return itemReturn;
		});
		/** Sorting data default by Descendent */
		products.docs = _.orderBy(products.docs, ["count"], "desc");
		return ResponseHelper.resInfo(products);
	}

	/** Get data product sorting via highest favorite by all customer
	 * @param ctx
	 * @output @output object: {code, data, message} */
	async getReportProductFavorite(ctx) {
		/** Check and process input params and get favorite products */
		const params = RequestHelper.getParamsByMethodType(ctx);
		const sort = { count: -1 };
		let result = [];
		if (params.dateFr && params.dateTo) {
			const dateFr = this.novaHelper.convertToDate(params.dateFr);
			const dateTo = this.novaHelper.convertToDate(params.dateTo);
			if (dateFr && dateTo) {
				params.dateFr = dateFr.setHours(0, 0, 0, 0);
				params.dateTo = dateTo.setHours(24, 59, 59, 999);
				const filter = {
					"productFavorites.date": {
						$gte: new Date(params.dateFr),
						$lte: new Date(params.dateTo)
					}
				};
				result = await this.productCustomerModel.getListProductFavoriteSorting(filter, sort);
			}
		} else {
			result = await this.productCustomerModel.getListProductFavoriteSorting({}, sort);
		}
		/** Process favorite products saved and get info product data */
		if (!result || FunctionHelper.isEmpty(result)) {
			return ResponseHelper.resInfo(result);
		}
		const listProductFavorite = result;
		const listProductId = this.novaHelper.convertToMongoId(result.map((x) => x._id.productId));
		const listProductSku = [];
		result.map((x) => {
			if (_.isEmpty(x._id.sku) || listProductSku.findIndex((sku) => sku === x._id.sku) >= 0) {
				return x;
			}
			listProductSku.push(x._id.sku);
			return x;
		});
		let productFilter = {
			filter: {_id: {$in: listProductId}},
			skuFilter: {"skus.sku": {$in: listProductSku}}
		};
		if (params.industry) {
			const { filter, skuFilter } = await this.productFilterLogic
				.getBuildSearchProductByIndustry(ctx, true, params.industry);
			productFilter = {
				filter: {...filter, _id: {$in: listProductId}},
				skuFilter: {...skuFilter, "skus.sku": {$in: listProductSku}}
			};
		}
		const products = await this.productModel
			.listShowcasePaging(productFilter.filter, productFilter.skuFilter, sort, params.pageNumber, params.pageSize);
		if (!products || FunctionHelper.isEmpty(products.docs)) {
			return ResponseHelper.resInfo(products);
		}
		/** Return favorite product */
		products.docs = products.docs.map((product) => {
			const itemReturn = {
				_id: product._id,
				productCode: product.productCode,
				sku: product.skus && product.skus.sku ? product.skus.sku : "",
				name: product.skus && product.skus.sku ? product.skus.name : product.name,
				price: product.skus && product.skus.price ? product.skus.price : product.price,
				quantity: product.skus && product.skus.quantity ? product.skus.quantity : product.quantity,
				img: product.skus && product.skus.img ? product.skus.img : product.img,
				isActive: product.isActive
			};
			const productFavorite = listProductFavorite
				.find((k) => k._id.productId.toString() === itemReturn._id.toString() && k._id.sku === itemReturn.sku);
			if (!productFavorite || _.isEmpty(productFavorite)) {
				return itemReturn;
			}
			itemReturn.count = productFavorite.count;
			return itemReturn;
		});
		/** Sorting data default by Descendent */
		products.docs = _.orderBy(products.docs, ["count"], "desc");
		return ResponseHelper.resInfo(products);
	}

	/** PRIVATE FUNCTIONS */

	/** Save product was view by customer. This function need customer authorization
	 * @param context
	 * @output object: {code, data, message}
	 */
	async funcSaveProductView(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		const accountObj = RequestHelper.getCurrentAccount(context);
		const customerId = accountObj.userId;
		const productId = params.id;
		const sku = params.sku;
		if (!customerId || !productId) {
			return false;
		}
		const productCustomer = await this.productCustomerModel.findOne({customerId});
		if (_.isEmpty(productCustomer)) {
			/** Customer have not data ==> Create new record tracking for this customer */
			const productCustomerCreate = {
				customerId,
				productFavorites: [],
				productViews: [{
					id: productId,
					sku,
					count: 1
				}]
			};
			const isAdd = await this.productCustomerModel.create(productCustomerCreate);
			return isAdd && isAdd._id;
		}
		if (!productCustomer.productViews || FunctionHelper.isEmpty(productCustomer.productViews)) {
			/** Customer have data tracking but product viewed is empty */
			productCustomer.productViews = [{
				id: productId,
				sku,
				count: 1
			}];
			const isSave = await this.productCustomerModel.update(productCustomer);
			return isSave.nModified > 0;
		}
		const productViewExisted = productCustomer.productViews
			.findIndex((productView) => productView.id === productId && productView.sku === sku);
		if (productViewExisted < 0) {
			/** Add product to list favorite product */
			productCustomer.productViews.push({id: productId, sku, count: 1});
			const isSave = await this.productCustomerModel.update(productCustomer);
			return isSave.nModified > 0;
		}
		const currentCount = productCustomer.productViews[productViewExisted].count + 1;
		const isUpdate = await this.productCustomerModel.updateSet(
			{
				_id: productCustomer._id,
				"productViews.id": productId,
				"productViews.sku": sku
			}, {
				$set: {"productViews.$.count": currentCount }
			}
		);
		return isUpdate.nModified > 0;
	}

	/** Get data product id favorite and viewed by customerId
	 * @Param customerId: string (require)
	 * @output object: {code, data, message} */
	async funcGetProductForCustomer(customerId) {
		if (!customerId) {
			return {};
		}
		return await this.productCustomerModel.findOne({customerId});
	}
}

module.exports = ProductCustomerLogic;