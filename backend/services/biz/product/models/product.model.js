const mongoose = require("mongoose");
const {APP_SETTING} = require("../defined");
const {NovaHelpers} = require("../../../../libs");
const { Schema } = require("mongoose");
const {Mixed} = Schema.Types;

/** Define fields model */
const fields = {
	productCode: { type: String, defalut: ""}, // Added 24/06/2020 request of product team
	templateId: { type: String, require: [true, "Template id is required"]},
	templateRev: { type: String, require: [true, "Template revision id is required"]},
	img: { type: String, default: "" },
	photos: { type: Array, default: [""] },
	img360: { type: String, default: "" },
	photos360: { type: Array, default: [""] },
	name: { type: Object, require: [true, "Name is required"]},
	shortDesc: { type: Object, default: {vi: "", en: ""}},
	description: { type: Object, default: {vi: "", en: ""}},
	price: { type: Number, default: 0 },
	quantity: { type: Number, default: 0 },
	unit: { type: String, default: "" },
	tags: { type: Array, default: [{}]},
	attrs: { type: Mixed },
	skuAttrs: [
		{
			name: { type: Object },
			values: { type: Mixed },
			type: { type: String, default: "" },
			key: { type: String, default: "" },
			unit: { type: String, default: ""}
		}
	],
	skus: [
		{
			refCode: { type: String, default: ""}, // Added 24/06/2020 request of product team
			name: { type: Object },
			attrs: { type: Mixed },
			attrsExt: {type: Mixed },
			sku: { type: String },
			img: { type: String },
			photos: { type: Array },
			price: { type: Number, default: 0 },
			shortDesc: { type: Object },
			description: { type: Object },
			quantity: { type: Number, default: 0 },
			isActive: { type: Boolean, default: false },
			isShowcase: { type: Boolean, default: false }
		}
	],
	isActive: { type: Boolean, default: true },
	isDelete: { type: Boolean, default: false },
	createDate: { type: Date, default: new Date() },
	createBy: { type: String, default: "Administrator" },
	updateDate: { type: Date, default: new Date() },
	updateBy: { type: String, default: "Administrator" },
	searchInfo: {type: Object, default: {}}
};

/**
 ProductModel: Processing product data model for logic
 */

class ProductModel {
	/** IndustryModel connection db created when service start
	 * @param dbConnection connection db created when service start
	 * @param plugins is array plugin use to add to schema
	 * @param logger
	 */
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields, plugins).set("minimize", false);
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.PRODUCT, this.schema);
	}

	/** Create a product
	 * @param ent product info
	 * @output object product created
	 */
	async create(ent) {
		return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a product
	 * @param ent product info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a product
	 * @param _id product id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a product
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all product -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array product
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await NovaHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list product
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array product
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list product
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array product
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Get list product sku active have paging
	 * @param filter object contains filter condition props
	 * @param skuFilter object contains sku filter condition props
	 * @param sort object contains sorting props
	 * @param skip number records will skip
	 * @param limit number max records will get
	 * @output array product
	 */
	async listPopulateSkuPaging(filter, skuFilter, sort = {createdAt: -1}, skip = 1, limit = 20) {
		if (!filter) {
			filter = {isActive: true, isDelete: false};
		}
		if (!skuFilter) {
			skuFilter = { "skus.isActive": true };
		}
		skip = parseInt(skip, 10);
		limit = parseInt(limit, 10);
		const filters = [{ $match: filter },
			{ $unwind: "$skus" },
			{ $match: skuFilter },
			{ $sort: sort },
			{ $limit: limit },
			{ $skip: skip }];
		return await NovaHelpers.MongoFuncHelper.$aggregate(this.model, filters);
	}

	/** Get list product sku active
	 * @param filter object contains filter condition props
	 * @param skuFilter object contains sku filter condition props
	 * @param sort object contains sorting props
	 * @output array product
	 */
	async listPopulateSku(filter, skuFilter, sort = {createdAt: -1}) {
		if (!filter) {
			filter = {isActive: true, isDelete: false};
		}
		if (!skuFilter) {
			skuFilter = {
				"skus.isActive": true,
				"skus.isShowcase": true
			};
		}
		return await NovaHelpers.MongoFuncHelper.$aggregate(this.model,
			[
				{$match: filter},
				{
					$unwind: {
						path: "$skus", preserveNullAndEmptyArrays: true
					}
				},
				{$match: skuFilter},
				{$sort: sort}
			]);
	}

	/** Get list showcase product spu mixed sku
	 * @param filter object contains filter condition props
	 * @param skuFilter object contains sku filter condition props
	 * @param sort object contains sorting props
	 * @param skip number records will skip
	 * @param limit number max records will get
	 * @output array product
	 */
	async listShowcase(filter, skuFilter, sort = {createdAt: -1}, skip = 0, limit = 20) {
		if (!filter) {
			filter = {isActive: true, isDelete: false};
		}
		if (!skuFilter) {
			skuFilter = { "skus.isActive": true, "skus.isShowcase": true };
		}
		skip = parseInt(skip, 10);
		limit = parseInt(limit, 10);
		const aggregateFilter = [
			{ $match: filter },
			{
				$unwind: {
					path: "$skus", preserveNullAndEmptyArrays: true
				}
			},
			{ $match: {$or: [{"skus.isActive": {$exists: false}}, skuFilter]} },
			{ $sort: sort},
			{ $skip: skip },
			{ $limit: limit }
		];
		return await NovaHelpers.MongoFuncHelper.$aggregate(this.model, aggregateFilter);
	}

	/** Get list showcase product spu mixed sku
	 * @param filter object contains filter condition props
	 * @param skuFilter object contains sku filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array product
	 */
	async listShowcasePaging(filter, skuFilter, sort = {createdAt: -1}, pageIndex = 1, pageSize = 20) {
		if (!filter) {
			filter = {isActive: true, isDelete: false};
		}
		if (!skuFilter) {
			skuFilter = { "skus.isActive": true, "skus.isShowcase": true };
		}
		pageIndex = parseInt(pageIndex, 10);
		pageIndex = pageIndex < 1 ? 1 : pageIndex;
		pageSize = parseInt(pageSize, 10);
		const aggregateFilter = [
			{ $match: filter },
			{
				$unwind: {
					path: "$skus", preserveNullAndEmptyArrays: true
				}
			},
			{ $match: {$or: [{"skus.isActive": {$exists: false}}, skuFilter]} },
		];
		return await NovaHelpers.MongoFuncHelper.$aggregatePaging(this.model, aggregateFilter,
			{page: pageIndex, limit: pageSize, sort});
	}

	/** Set is active or in-active a product
	 * @param _id product id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await NovaHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	/** Set is active or in-active a product sku
	 * @param _id product id
	 * @param sku product
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActiveSku(_id, sku, isActive) {
		const filterObj = {
			_id,
			"skus.sku": sku
		};
		const setObj = {
			$set: {
				"skus.$.isActive": isActive
			}
		};
		return await NovaHelpers.MongoFuncHelper.$updateSet(this.mode, filterObj, setObj);
	}

	/** Set is delete or in-delete a product
	 * @param _id product id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await NovaHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}

	/** Get a product by code
	 * @param code product code
	 * @output object result updating
	 */
	async getByCode(code) {
		return await NovaHelpers.MongoFuncHelper.$getByCode(this.model, code);
	}
}

module.exports = ProductModel;
