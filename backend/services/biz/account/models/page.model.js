const mongoose = require("mongoose");
const {NovaHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	name: {},
	children: Array,
	order: Number,
	isActive: { type: Boolean, default: true },
	isDelete: { type: Boolean, default: false },
	createdBy: String,
	updatedBy: String,
	createdAt: Date,
	updatedAt: Date
};

class PageModel {
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields, {timestamps: true}, plugins);
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		/** Add encryption plugin */
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.PAGES, this.schema);
	}

	async create(ent) {
		return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	async getById(_id, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	async findOne(filter, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	async getAll(filter, sort = {}, select = {}) {
		return await NovaHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	async setIsActive(_id, isActive) {
		return await NovaHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	async setIsDelete(_id, isDelete) {
		return await NovaHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}
}

module.exports = PageModel;
