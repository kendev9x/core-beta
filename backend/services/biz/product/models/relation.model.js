const mongoose = require("mongoose");
const {CoreHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	parent: {
		id: String,
		name: String
	},
	child: [{
		id: String,
		name: String
	}],
	relationType: {
		id: String,
		name: String
	},
	isDelete: {
		type: Boolean,
		default: false
	},
	dataExt: {
	},
	industry: {
		id: String,
		name: String
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
 RelationModel: Processing Relation data model for logic
 */
class RelationModel {
	/** RelationModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.RELATION, this.schema);
	}

	/** Create a Relation
	 * @param ent Relation info
	 * @output object Relation created
	 */
	async create(ent) {
		return await CoreHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a Relation
	 * @param ent Relation info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await CoreHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a Relation
	 * @param _id Relation id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a Relation
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all Relation -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array Relation
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list Relation
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array Relation
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list Relation
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array Relation
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Set is active or in-active a Relation
	 * @param _id Relation id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await CoreHelpers.MongoFuncHelper.$setIsActive(this.model, _id, isActive);
	}

	/** Set is delete or in-delete a Relation
	 * @param _id Relation id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await CoreHelpers.MongoFuncHelper.$setIsDelete(this.model, _id, isDelete);
	}

	/** Get a Relation by code
	 * @param code Relation code
	 * @output object result updating
	 */
	async getByCode(code) {
		return await CoreHelpers.MongoFuncHelper.$getByCode(this.model, code);
	}
}

module.exports = RelationModel;
