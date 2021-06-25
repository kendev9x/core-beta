const mongoose = require("mongoose");
const {APP_SETTING} = require("../defined");
const {NovaHelpers} = require("../../../../libs");

const fields = {
	customerId: { type: String, require: [true, "accountId required"]},
	productFavorites: [
		{
			id: { type: String, require: [true, "favorite product required productId"]},
			sku: { type: String },
			date: { type: Date, default: new Date() }
		}
	],
	productViews: [
		{
			id: { type: String, require: [true, "product viewed required productId"]},
			sku: { type: String },
			date: { type: Date, default: new Date() },
			count: { type: Number, default: 1}
		}
	],
};

/**
 ProductCustomerModel: Processing ProductCustomer data model for logic
 */
class ProductCustomerModel {
	/** ProductCustomerModel connection db created when service start
	 * @param dbConnection connection db created when service start
	 * @param plugins is array plugin use to add to schema
	 * @param logger
	 */
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields);
		plugins.map((plugin) => this.schema.plugin(plugin));
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.PRODUCT_CUSTOMER, this.schema);
	}

	/** Create a product-customer data
	 * @param ent product-customer data info
	 * @output object product-customer data created
	 */
	async create(ent) {
		return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a product-customer data
	 * @param ent product-customer data info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Updating a product-customer data
	 * @output object result updating
	 * @param filterObj
	 * @param setObj
	 */
	async updateSet(filterObj, setObj) {
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, filterObj, setObj);
	}

	/** Get a product-customer data
	 * @param _id product-customer data id
	 * @output object result
	 */
	async getById(_id) {
		return await NovaHelpers.MongoFuncHelper.$getById(this.model, _id);
	}

	/** Get a product-customer data
	 * @param filter object contains filter condition props
	 * @output object result updating
	 */
	async findOne(filter) {
		return await NovaHelpers.MongoFuncHelper.$findOne(this.model, filter);
	}

	/** Get all product-customer data -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array product-customer data
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await NovaHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list product-customer data
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array product-customer data
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list product-customer data
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array product-customer data
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Get list report products were viewed
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number records will skip
	 * @param limit number max records will get
	 * @output array product-customer data
	 */
	async getListProductViewedSorting(filter = {}, sort = {count: -1},
		skip = 0, limit = 100) {
		const aggregateFilter = [
			{$match: filter},
			{$unwind: "$productViews"},
			{
				$group: {
					_id: {
						productId: "$productViews.id",
						sku: "$productViews.sku"
					},
					count: {
						$sum: "$productViews.count"
					},
					customers: {
						$push: {
							customerId: "$customerId"
						}
					}
				}
			},
			{$sort: sort},
			{$skip: skip},
			{$limit: limit}
		];
		return await NovaHelpers.MongoFuncHelper.$aggregate(this.model, aggregateFilter);
	}

	/** Get list report products were favorite
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number records will skip
	 * @param limit number max records will get
	 * @output array product-customer data
	 */
	async getListProductFavoriteSorting(filter = {}, sort = {count: -1}, skip = 0,
		limit = 100) {
		const aggregateFilter = [
			{$match: filter},
			{$unwind: "$productFavorites"},
			{
				$group: {
					_id: {productId: "$productFavorites.id", sku: "$productFavorites.sku"},
					count: {
						$sum: 1
					},
					customers: {
						$push: {
							customerId: "$customerId"
						}
					}
				}
			},
			{$sort: sort},
			{$skip: skip},
			{$limit: limit}
		];
		return await NovaHelpers.MongoFuncHelper.$aggregate(this.model, aggregateFilter);
	}
}

module.exports = ProductCustomerModel;
