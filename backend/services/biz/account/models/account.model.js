const mongoose = require("mongoose");
const {NovaHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	password: { type: String },
	lastTimeLogin: { type: Date },
	registrationTime: { type: Date }, // this is time account created
	emailResetPassword: { type: String }, // system will use there for reset password
	havenPassword: { type: Boolean, default: false }, // if true: User have password, false: user don't have password
	typeAccount: { type: String },
	statusCreatedAccount: { type: String }, // PENDING, SUCCESS, REJECT
	statusLogin: { type: String }, // User is login : ONLINE, OFFLINE,
	extendSystem: {},
	isActive: { type: Boolean, default: true },
	isDelete: { type: Boolean, default: false },
	createdBy: { type: String },
	updatedBy: { type: String },
	/** ADD FOR TESTING ENCRYPTION FIELDS */
	phone: { type: String, get: NovaHelpers.EncryptHelper.decryptIv, set: NovaHelpers.EncryptHelper.encryptIv, default: "" },
	email: { type: String, get: NovaHelpers.EncryptHelper.decryptIv, set: NovaHelpers.EncryptHelper.encryptIv, default: "" }
};

/**
 CustomerModel: Processing Customer data model for logic
 */
class CustomerModel {
	/** CustomerModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.CUSTOMER, this.schema);
	}

	/** Search by phone encrypted */
	async getByPhone(phone) {
		const filter = {
			phone: phone
		};
		return NovaHelpers.MongoFuncHelper.$findOne(this.model, filter);
	}

	/** Create a Customer
	 * @param ent Customer info
	 * @output object Customer created
	 */
	async create(ent) {
		return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a Customer
	 * @param ent Customer info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a Customer
	 * @param _id Customer id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a Customer
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all Customer -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array Customer
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await NovaHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list Customer
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array Customer
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list Customer
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array Customer
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Set is active or in-active a Customer
	 * @param _id Customer id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await NovaHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	/** Set is delete or in-delete a Customer
	 * @param _id Customer id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await NovaHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}
}

module.exports = CustomerModel;
