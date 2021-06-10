const mongoose = require("mongoose");
const {APP_SETTING} = require("../defined");
const {NovaHelpers} = require("../../../../libs");
const { Schema } = require("mongoose");
const {Mixed} = Schema.Types;

const fields = {
	mongo: {type: Mixed},
	elastic: {type: Mixed}
};

/**
 ProductFilterConfigModel: Processing ProductFilterConfig data model for logic
 */
class ProductFilterConfigModel {
	/** ProductFilterConfigModel connection db created when service start
	 * @param dbConnection connection db created when service start
	 * @param plugins is array plugin use to add to schema
	 * @param logger
	 */
	constructor(dbConnection, plugins = [], logger = {}) {
		this.logger = logger;
		this.dbConnection = dbConnection;
		this.schema = mongoose.Schema(fields, plugins).set("minimize", false);
		this.schema.set("minimize", false);
		this.schema.set("toObject", { getters: true });
		this.schema.set("toJSON", { getters: true });
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.PRODUCT_FILTER_CONFIG, this.schema);
	}

	/** Get filter config
	 * @output object ProductFilterConfig created
	 */
	async getConfig() {
		return await NovaHelpers.MongoFuncHelper.$findOne(this.model, {});
	}
}

module.exports = ProductFilterConfigModel;
