const mongoose = require("mongoose");
const {CoreHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	appName: { type: String }, // system will use there for reset password
	appVersion: { type: String },
	uuid: { type: String, unique: true},
	osVersion: { type: String },
	os: { type: String }
};

/**
 DeviceModel: Processing Device data model for logic
 */
class DeviceInfoModel {
	/** DeviceModel connection db created when service start
	 * @param dbConnection connection db created when service start
	 * @param plugins is array plugin use to add to schema
	 * @param logger
	 */
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields, {timestamps: true}, plugins);
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		/** Add encryption plugin */
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.DEVICE_INFO, this.schema);
	}

	/** Create a Device
	 * @param ent Device info
	 * @output object Device created
	 */
	async create(ent) {
		return await CoreHelpers.MongoFuncHelper.$findOneAndUpdate(this.model, ent);
	}

	/** Updating a Device
	 * @param ent Device info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await CoreHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a Device
	 * @param _id Device id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a Device
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all Device -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array Device
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list Device
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array Device
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}
}

module.exports = DeviceInfoModel;
