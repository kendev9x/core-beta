const mongoose = require("mongoose");
const {CoreHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	customerId: { type: String },
	businessCode: { type: String }, // system will use there for reset password
	walletCode: { type: String },//bamWalletCode
	walletId: { type: String },
	userId:  { type: String},
	effectiveDate: { type: Date },
	ticketCode: {type: String},
	amount: { type: Number },
	content:  { type: String},
	status:  { type: String},
	extends: {
		customerName: { type: String },
		gender: { type: String },
		phone: { type: String },
		identityType: { type: String },
		identityNumber: { type: String },
		company: { type: String },
		workPlace: { type: String },
		position: { type: String },
		email: { type: String },
		level: { type: String },
		supervisor: { type: String },
	},

	isActive: { type: Boolean, default: true },
	isDelete: { type: Boolean, default: false },
};

/**
 ApiKeyModel: Processing ApiKey data model for logic
 */
class CashWalletModel {
	/** ApiKeyModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.CASH_WALLET, this.schema);
	}

	/** Search by phone encrypted */
	async getByAgent(agent) {
		const filter = {
			user_agent: agent
		};
		return CoreHelpers.MongoFuncHelper.$findOne(this.model, filter);
	}

	/** Create a ApiKey
	 * @param ent ApiKey info
	 * @output object ApiKey created
	 */
	async findOneAndUpdate(ent, filter) {
		return await CoreHelpers.MongoFuncHelper.$findOneAndUpdate(this.model, ent, filter);
	}

	async create(ent) {
		return await CoreHelpers.MongoFuncHelper.$save(this.model, ent);
	}
	async updateOne(filter, ent) {
		return await CoreHelpers.MongoFuncHelper.$updateSet(this.model, filter, ent);
	}

	/** Get a ApiKey
	 * @param _id ApiKey id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a ApiKey
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all ApiKey -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array ApiKey
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list ApiKey
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array ApiKey
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list ApiKey
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array ApiKey
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Set is active or in-active a ApiKey
	 * @param _id ApiKey id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await CoreHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	/** Set is delete or in-delete a ApiKey
	 * @param _id ApiKey id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await CoreHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}
}

module.exports = CashWalletModel;
