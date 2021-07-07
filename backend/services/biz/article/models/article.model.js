const mongoose = require("mongoose");
const { CoreHelpers } = require("../../../../libs");
const { APP_SETTING } = require("../defined");

const fields = {
	name: {
		vi: String,
		en: String,
	},
	shortDesc: {
		vi: String,
		en: String,
	},
	type: String,
	detail: {
		vi: String,
		en: String,
	},
	isActive: { type: Boolean, default: false },
	isDelete: { type: Boolean, default: false },
	state: String, // "INITIAL" or PUBLISH, or DISABLE,
	image: String,
	publishDate: Date,
	createdBy: String,
	updatedBy: String,
	data: [],
	tags: [],
	industry: {
		id: String,
		name: String,
	},
	project: {
		id: String,
		name: String,
	},
	product: {
		id: String,
		name: String,
	},
	category: String,
};

class ArticleModel {
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields);
		plugins.map((plugin) => this.schema.plugin(plugin));
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		this.model = this.dbConnection.model(
			APP_SETTING.DB_COLLECTION.ARTICLES,
			this.schema
		);
	}

	async createArticle(entity) {
		return await CoreHelpers.MongoFuncHelper.$save(this.model, entity);
	}

	async updateArticle(id, entity) {
		return CoreHelpers.MongoFuncHelper.$updateOne(id, entity);
	}

	async findArticleById(id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(
			this.model,
			id,
			(isWithoutCheckDelete = false)
		);
	}

  async findArticleByIds(ids) {
		const query = { _id: { $in: ids } };
		return await CoreHelpers.MongoFuncHelper.$findByListId(this.model, ids);
	}

	async findArticle(
		query = {},
		pageIndex,
		pageSize,
		sort = { createdAt: -1 }
	) {
		return await CoreHelpers.MongoFuncHelper.$listPaging(
			this.model,
			query,
			sort,
			pageIndex,
			pageSize
		);
	}

	async findArticleByQuery(query, skip = 0, limit = 20, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$list(
			this.model,
			query,
			{},
			skip,
			limit,
			select
		);
	}

	async findAllAndSort(query = {}) {
		return Promise.resolve(
			this.model.find(query).sort({ updatedAt: "desc" })
		).then((re) => re);
	}

	async updateOne(conditionObj, newObj) {
		return await CoreHelpers.MongoFuncHelper.$updateOne(
			this.model,
			conditionObj,
			newObj
		);
	}

	async listPaging(
		filter,
		sort = { createdAt: -1 },
		pageIndex = 0,
		pageSize = 20
	) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$listPaging(
			this.model,
			filter,
			sort,
			pageIndex,
			pageSize
		);
	}
}

module.exports = ArticleModel;
