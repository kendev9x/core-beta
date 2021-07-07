const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const {Mixed} = Schema.Types;
const {CoreHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	name: { type: Object, require: [true, "Name is required"]},
	code: String,
	type: String,
	articleId: Mixed,
	index: Number,
	data: Object,
	isActive: {
		type: Boolean,
		default: true
	},
	isDelete: {
		type: Boolean,
		default: false
	},
	state: {
		type: Number,
		default: 0
	},
	createBy: {
		type: String,
		default: "System"
	},
	updateBy: {
		type: String,
		default: "System"
	}
};

/**
 EntityModel: Processing Entity data model for logic
 */
class EntityModel {
	/** EntityModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.ENTITY, this.schema);
	}

	/** Create a Entity
	 * @param ent Entity info
	 * @output object Entity created
	 */
	async create(ent) {
		return await CoreHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a Entity
	 * @param ent Entity info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await CoreHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a Entity
	 * @param _id Entity id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a Entity
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all Entity -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array Entity
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list Entity
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array Entity
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list Entity
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array Entity
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Set is active or in-active a Entity
	 * @param _id Entity id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await CoreHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	/** Set is delete or in-delete a Entity
	 * @param _id Entity id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await CoreHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}

	/** Get a Entity by code
	 * @param code Entity code
	 * @output object result updating
	 */
	async getByCode(code) {
		return await CoreHelpers.MongoFuncHelper.$getByCode(this.model, code);
	}

	/** Get list Entity by list id
	 * @param listId array entity id
	 * @output object result updating
	 */
	async getByListId(listId) {
		return await CoreHelpers.MongoFuncHelper.$findByListId(listId);
	}

	async createMany(listEnt) {
		return await CoreHelpers.MongoFuncHelper.$saveMany(this.model, listEnt);
	}
}

module.exports = EntityModel;
