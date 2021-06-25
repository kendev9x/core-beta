const mongoose = require("mongoose");
const { Schema } = require("mongoose");
const {NovaHelpers} = require("../../../../libs");
const {APP_SETTING} = require("../defined");

const fields = {
	languages: {
		type: [{
			code: {type: String, default: ""},
			name: {type: Object, default: {vi: "", en: ""}},
			icon: {type: String, default: ""},
			isDefault: {type: Boolean, default: false}
		}]
	},
	currencies: {
		type: [{
			code: {type: String, default: ""},
			name: {type: Object, default: {vi: "", en: ""}},
			isDefault: {type: Boolean, default: false}
		}]
	},
	productTypes: {
		type: [{
			code: {type: String, default: ""},
			displayName: {type: Object, default: {vi: "", en: ""}},
			value: {type: Number, default: 0}
		}]
	},
	inputTypes: {
		type: [
			{
				code: {type: String, default: ""},
				displayName: {type: Object, default: {vi: "", en: ""}},
			}
		]
	},
	filter: {type: Schema.Types.Mixed},
	businessKeys: {type: Schema.Types.Mixed},
	feedBack: {
		types: [
			{
				code: {type: String, default: ""},
				name: {type: Object, default: {vi: "", en: ""}},
				img: {type: String, default: ""}
			}
		],
		status: [
			{
				code: {type: String, default: ""},
				name: {type: Object, default: {vi: "", en: ""}},
			}
		]
	},
	alertConfig: {type: Schema.Types.Mixed},
	createdBy: {type: String},
	updatedBy: {type: String},
};

/**
 IndustryModel: Processing industry data model for logic
 */
class SystemSettingModel {
	/** SystemSettingModel connection db created when service start
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
		this.model = this.dbConnection.model(APP_SETTING.DB_COLLECTION.SYSTEM_SETTING, this.schema);
	}

	/** GET SETTING
	 * @output Promise<T>: Setting Object */
	async getSetting() {
		const result = await NovaHelpers.MongoFuncHelper.$getAll(this.model);
		if (result && result.length > 0) {
			return result[0];
		}
		return {};
	}

	/** GET KEYWORD PROMOTE CONFIG AT FILTER SETTING BY INDUSTRY
	 * @param type: String as industry code
	 * @param pageNumber
	 * @param pageSize
	 * @output Promise<T>: Setting Object */
	async getKeywordByType(type, pageNumber = 1, pageSize = 10) {
		const aggregateFilters = [
			{$match: {_id: {$exists: true}}},
			{$project: {keyword: `$filter.${type}.keywords.values`}},
			{$unwind: {path: "$keyword"}}
		];
		return await NovaHelpers.MongoFuncHelper
			.$aggregatePaging(aggregateFilters, {pageSize, pageNumber});
	}
}

module.exports = SystemSettingModel;
