const mongoose = require("mongoose");
const {APP_SETTING} = require("../defined");
const {CoreHelpers} = require("../../../../libs");
const { Schema } = require("mongoose");
const {Mixed} = Schema.Types;

const fields = {
	name: { type: Object, required: [true, "Name required"] },
	industry: { type: String, required: [true, "Industry Type required"] },
	shortDesc: { type: Object, default: {vi: "", en: ""}},
	description: { type: Object, default: {vi: "", en: ""}},
	revisions: [
		{
			_id: { type: String, default: "" },
			fields: [
				{
					name: { type: String, required: [true, "name in template required"] },
					label: { type: Object, required: [true, "label in template required"] },
					type: { type: String, default: "TEXT" },
					entType: { type: String, default: "" },
					dataScope: { type: Mixed, default: null },
					isMultiSelect: { type: Boolean, default: false },
					isRequired: { type: Boolean, default: false },
					isDisabled: { type: Boolean, default: false }, /** This field use to check
           can overwrite value data scope or not */
					isFilter: { type: Boolean, default: false },
					key: String,
					validation: { type: Object, default: {} },
					index: { type: Number, default: null },
					unit: { type: String, default: ""}
				}
			],
			isDelete: { type: Boolean, default: false }
		}
	],
	isActive: { type: Boolean, default: true },
	isDelete: { type: Boolean, default: false },
	createDate: { type: Date, default: new Date() },
	createBy: { type: String, default: "Administrator" },
	updateDate: { type: Date, default: new Date() },
	updateBy: { type: String, default: "Administrator" },
	searchInfo: {type: Object, default: {}}
};

/**
 ProductTemplateModel: Processing ProductTemplate data model for logic
 */
class ProductTemplateModel {
	/** ProductTemplateModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.PRODUCT_TEMPLATE, this.schema);
	}

	/** Create a ProductTemplate
	 * @param ent ProductTemplate info
	 * @output object ProductTemplate created
	 */
	async create(ent) {
		return await CoreHelpers.MongoFuncHelper.$save(this.model, ent);
	}

	/** Updating a ProductTemplate
	 * @param ent ProductTemplate info
	 * @output object result updating
	 */
	async update(ent) {
		const filter = {
			_id: ent._id,
		};
		return await CoreHelpers.MongoFuncHelper.$updateOne(this.model, filter, ent);
	}

	/** Get a ProductTemplate
	 * @param _id ProductTemplate id
	 * @param isWithoutCheckDelete
	 * @output object result
	 */
	async getById(_id, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$getById(this.model, _id, isWithoutCheckDelete);
	}

	/** Get a ProductTemplate
	 * @param filter object contains filter condition props
	 * @param isWithoutCheckDelete
	 * @output object result updating
	 */
	async findOne(filter, isWithoutCheckDelete = false) {
		return await CoreHelpers.MongoFuncHelper.$findOne(this.model, filter, isWithoutCheckDelete);
	}

	/** Get all ProductTemplate -- just use for test
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param select object contains selecting field
	 * @output array ProductTemplate
	 */
	async getAll(filter, sort = {}, select = {}) {
		return await CoreHelpers.MongoFuncHelper.$getAll(this.model, filter, sort, select);
	}

	/** Get list ProductTemplate
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param skip number skip records
	 * @param limit number max records will get
	 * @param select object contains selecting field
	 * @output array ProductTemplate
	 */
	async list(filter, sort = {createdAt: -1}, skip = 0, limit = 20, select = {}) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$list(this.model, filter, sort, skip, limit, select);
	}

	/** Get list ProductTemplate
	 * @param filter object contains filter condition props
	 * @param sort object contains sorting props
	 * @param pageIndex number current page
	 * @param pageSize number max records will get
	 * @output array ProductTemplate
	 */
	async listPaging(filter, sort = {createdAt: -1}, pageIndex = 0, pageSize = 20) {
		if (!filter) {
			filter = {};
		}
		return await CoreHelpers.MongoFuncHelper.$listPaging(this.model, filter, sort, pageIndex, pageSize);
	}

	/** Set is active or in-active a ProductTemplate
	 * @param _id ProductTemplate id
	 * @param isActive value will updating
	 * @output object result updating
	 */
	async setIsActive(_id, isActive) {
		return await CoreHelpers.MongoFuncHelper.$setIsActive(this.model, _id, isActive);
	}

	/** Set is delete or in-delete a ProductTemplate
	 * @param _id ProductTemplate id
	 * @param isDelete value will updating
	 * @output object result updating
	 */
	async setIsDelete(_id, isDelete) {
		return await CoreHelpers.MongoFuncHelper.$setIsDelete(this.model, _id, isDelete);
	}

	/** Get a ProductTemplate by code
	 * @param code ProductTemplate code
	 * @output object result updating
	 */
	async getByCode(code) {
		return await CoreHelpers.MongoFuncHelper.$getByCode(this.model, code);
	}

	/** Set is delete a revision for a template
	 * @param _id ProductTemplate id
	 * @param revId revision value
	 * @param isDelete value will set
	 * @output object result updating
	 */
	async setIsDeleteRevision(_id, revId, isDelete) {
		const filterObj = {
			_id,
			"revisions._id": revId
		};
		const setObj = {
			$set: {
				"revisions.$.isDelete": isDelete
			}
		};
		return await CoreHelpers.MongoFuncHelper.$updateSet(filterObj, setObj);
	}
}

module.exports = ProductTemplateModel;
