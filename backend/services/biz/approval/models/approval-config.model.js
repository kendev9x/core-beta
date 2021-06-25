const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const {NovaHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	industry: { type: String, defaults: "BDS" },
	type: { type: String, defaults: "PROJECT" },
	data: {
		id: { type: String, defaults: null },
		name: { type: Object, defaults: null },
	},
	setting: {
		type: Schema.Types.Mixed,
		defaults: {
			product: {
				type: Schema.Types.Mixed,
				defaults: {
					levels: [
						{
							level: "reviewer1",
							status: "FIRST-APPROVED",
							label: "Đã xem xét lần 1",
						},
						{
							level: "reviewer2",
							status: "SECOND-APPROVED",
							label: "Đã xem xét lần 2"
						},
						{
							level: "publisher",
							status: "PUBLISH",
							label: "Phát hành"
						}
					],
					reviewer1: [
						{
							userId: "-1",
							fullName: "N/A",
							userName: ""
						}
					],
					reviewer2: [
						{
							userId: "-1",
							fullName: "N/A",
							userName: ""
						}
					],
					publisher: [
						{
							userId: "-1",
							fullName: "N/A",
							userName: ""
						}
					],
				}
			},
			article: {
				type: Schema.Types.Mixed,
				defaults: {
					levels: [
						{
							level: "reviewer1",
							status: "FIRST-APPROVED",
							label: "Đã xem xét lần 1",
						},
						{
							level: "reviewer2",
							status: "SECOND-APPROVED",
							label: "Đã xem xét lần 2"
						},
						{
							level: "publisher",
							status: "PUBLISH",
							label: "Phát hành"
						}
					],
					reviewer1: [
						{
							userId: "-1",
							fullName: "N/A",
							userName: ""
						}
					],
					reviewer2: [
						{
							userId: "-1",
							fullName: "N/A",
							userName: ""
						}
					],
					publisher: [
						{
							userId: "-1",
							fullName: "N/A",
							userName: ""
						}
					],
				}
			},
		}
	}
};

/**
 ApprovalConfigModel: Processing industry data model for logic
 */
class ApprovalConfigModel {
	/** ApprovalConfigModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.APPROVAL_CONFIG, this.schema);
	}

	/** Create a approval config
	 * @param ent approval info
	 * @output object approval created
	 */
	async create(ent) {
		return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a approval config
	 * @param ent approval config info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a approval config
	 * @param _id approval config id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a approval config
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await NovaHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all approval config -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array approval config
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await NovaHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list approval config
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array approval config
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list approval config
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array approval config
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await NovaHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Set is active or in-active a approval config
	 * @param _id approval config id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await NovaHelpers.MongoFuncHelper.$setIsActive(this.mode, _id, isActive);
	}

	/** Set is delete or in-delete a approval config
	 * @param _id approval config id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await NovaHelpers.MongoFuncHelper.$setIsDelete(this.mode, _id, isDelete);
	}

	/** Get a approval config by code
	 * @param code approval config code
	 * @output object result updating
	 */
	async getByCode(code) {
		return await NovaHelpers.MongoFuncHelper.$getByCode(this.model, code);
	}

	/** Create many approval config
	 * @output object config created
	 * @param listEnt
	 */
	async createMany(listEnt) {
		return await NovaHelpers.MongoFuncHelper.$saveMany(this.model, listEnt);
	}

	/** Find all approval config by list approval config id
	 * @output object approval created
	 * @param listId
	 * @param select
	 */
	async findByListId(listId, select = {}) {
		return await NovaHelpers.MongoFuncHelper.$findByListId(this.model, listId, select);
	}

	/** Updata a approval config
	 * @output object approval config created
	 * @param conditionObj
	 * @param newObj
	 */
	async updateOne(conditionObj, newObj) {
		return await NovaHelpers.MongoFuncHelper.$updateOne(this.model, conditionObj, newObj);
	}

	/** Get list approval config with aggregate query
	 * @output object approval config created
	 * @param aggregateParams
	 */
	async aggregate(aggregateParams) {
		return await NovaHelpers.MongoFuncHelper.$aggregate(this.model, aggregateParams);
	}
}

module.exports = ApprovalConfigModel;
