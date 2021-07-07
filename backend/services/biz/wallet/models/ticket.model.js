const mongoose = require("mongoose");
const {CoreHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	code: { type: String },
	customerId: { type: String },
	content: { type: String },
	address: { type: String },
	schedule_from: { type: Date },
	schedule_to: { type: Date },
	guest_phones: { type: Array },
	points: { type: Number},
	status: { type: String },
	isActive: { type: Boolean, default: true },
	isDelete: { type: Boolean, default: false },
};

/**
 ApiKeyModel: Processing ApiKey data model for logic
 */
class TicketModel {
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields, {timestamps: true}, plugins);
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		/** Add encryption plugin */
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.TICKET, this.schema);
	}

	/** Search by phone encrypted */
	async getLastTicket() {
		return CoreHelpers.MongoFuncHelper.$getLastItem(this.model);
	}


	async create(ent, filter) {
		return await CoreHelpers.MongoFuncHelper.$save(this.model, ent, filter);
	}

	async updateOne(filter, ent) {
		return await CoreHelpers.MongoFuncHelper.$updateSet(this.model, filter, ent);
	}

	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await CoreHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}


	async getById(_id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}


	async findOne(filter, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	async getAll(filter, sort = {}, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	async setIsActive(_id, isActive) {
		return await CoreHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	async setIsDelete(_id, isDelete) {
		return await CoreHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}
}

module.exports = TicketModel;
