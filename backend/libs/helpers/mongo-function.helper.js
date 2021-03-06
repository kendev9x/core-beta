const mongoose = require("mongoose");
const _ = require("lodash");

class MongoFuncHelper {
	/** Create entity model
	 * @output object model created
	 * @param model current model working
	 * @param entParam object entity model need to create*/
	async $save(model, entParam) {
		return model.create(entParam);
	}

	/** Update entity model
	 * @output object model created
	 * @param model current model working
	 * @param conditionObj object use to filter record need to update
	 * @param newObj object entity model was set value need to update
	 * */
	async $updateOne(model, conditionObj, newObj) {
		return await model.updateOne(conditionObj, newObj);
	}

	/** Update entity model
	 * @output object model created
	 * @param model current model working
	 * @param filterObj object use to filter record need to update
	 * @param setObj object entity model was set value need to update
	 * */
	async $updateSet(model, filterObj, setObj) {
		return await model.updateOne(filterObj, setObj);
	}

	/** Since upsert creates a document if not finds a document, you don't need to create another one manually.
	 *
	 * @param {*} model current model working
	 * @param {*} entParam object entity model need to create or update
	 * @param filter
	 * @returns
	 */
	async $findOneAndUpdate(model, entParam, filter = {}) {
		const options = { upsert: true, new: true,useFindAndModify: false, setDefaultsOnInsert: true };
		return await model.findOneAndUpdate(filter, entParam, options);
	}
	/** Get all entity model
	 * @output array entity model
	 * @param model current model working
	 * @param filter object contains filter props
	 * @param sort object contains sort props
	 * @param select object contains props name need to get*/
	async $getAll(model, filter = {}, sort = {}, select = {}) {
		return await model.find(filter, select).sort(sort).lean();
	}

	/** Get detail entity model
	 * @output object entity model
	 * @param model current model working
	 * @param _id entity model
	 * @param isWithOutCheckDelete type boolean
	 * @param select object contains props name need to get*/
	async $getById(model, _id, isWithOutCheckDelete = false, select = {}) {
		let id = "";
		if (mongoose.isValidObjectId(_id)) {
			id = _id;
		} else {
			id = this.convertToMongoId(_id);
		}
		const result = await model.findById(id, select);
		if (!result || _.isEmpty(result)) {
			return {};
		}
		const data = result.toObject();
		if (data && data.isDelete && !isWithOutCheckDelete) {
			return {};
		}
		return data ? data : {};
	}

	/** Get list entity model- usually use for mobile app logic
	 * @output array entity model
	 * @param model current model working
	 * @param query object contains query props
	 * @param sort object contains sort props
	 * @param skip int number records will skip
	 * @param limit int number records need to get
	 * @param select object contains props name need to get*/
	async $list(model, query = {}, sort = {}, skip = 0, limit = 20, select = {}) {
		let result = [];
		skip = Number.parseInt(skip, 10);
		limit = Number.parseInt(limit, 10);
		if (Number.isNaN(skip)) {
			skip = 0;
		}
		if (Number.isNaN(limit)) {
			limit = 20;
		}
		if (!skip || skip < 0) {
			skip = 0;
		}
		if (!limit || limit < 1) {
			limit = 20;
		}
		result = await model.find(query, select)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();
		return result;
	}

	/** Get list entity model paging - usually use for web portal logic
	 * @output array entity model
	 * @param model current model working
	 * @param query object contains query props
	 * @param sort object contains sort props
	 * @param pageIndex int current page
	 * @param limit int number records need to get every page
	 * @param select object contains props name need to get*/
	async $listPaging(model, query = {}, sort = {}, pageIndex = 0, limit = 20, select = {}) {
		pageIndex = Number.parseInt(pageIndex, 10);
		limit = Number.parseInt(limit, 10);
		if (Number.isNaN(pageIndex)) {
			pageIndex = 0;
		}
		if (Number.isNaN(limit)) {
			limit = 20;
		}
		pageIndex = pageIndex >= 1 ? pageIndex - 1 : 0;
		if (!pageIndex || pageIndex < 0) {
			pageIndex = 0;
		}
		if (!limit || limit < 0 || limit > 100) {
			limit = 20;
		}
		const options = {
			select,
			offset: pageIndex * limit,
			limit,
			sort
		};
		return await model.paginate(query, options);
	}

	/** Find a entity model
	 * @output object entity model
	 * @param model current model working
	 * @param filter object contains query props
	 * @param isWithOutCheckDelete type boolean
	 * @param select object contains props name need to get*/
	async $findOne(model, filter, isWithOutCheckDelete = false, select = {}) {
		let result = await model.findOne(filter, select);
		if (!result || _.isEmpty(result)) {
			return {};
		}
		const data = result.toObject();
		if (data && data.isDelete && !isWithOutCheckDelete) {
			return {};
		}
		return data ? data : {};
	}

	async $getLastItem(model){
		let result = await model.findOne({}).sort({_id: -1});
		if (!result || _.isEmpty(result)) {
			return {};
		}
		const data = result.toObject();
		if (data && data.isDelete) {
			return {};
		}
		return data ? data : {};
	}
	/** Get list entity model
	 * @output array entity model
	 * @param model is current model working
	 * @param aggregateFilters is array contains query aggregate props*/
	async $aggregate(model, aggregateFilters = []) {
		return model.aggregate(aggregateFilters);
	}

	/** Get a object paging list entity model
	 * @output array entity model
	 * @param model is current model working
	 * @param aggregateFilters is array contains query aggregate props
	 * @param options is object as: {page, limit, sort}*/
	async $aggregatePaging(model, aggregateFilters = [], options = {page: 1, limit: 10}) {
		const aggregate = model.aggregate(aggregateFilters);
		return model.aggregatePaginate(aggregate, options);
	}

	/** Get a list entity model
	 * @output array entity model
	 * @param model is current model working
	 * @param listId is array _id
	 * @param sort is object contain sorting props
	 * @param select is object contain props name need to get*/
	async $findByListId(model, listId, sort = {}, select = {}) {
		return await model.find(
			{_id: {$in: listId.map((id) => mongoose.Types.ObjectId(id))}}, select
		).sort(sort).lean();
	}

	/** Set isActive prop of a entity model
	 * @output object mongo result updating
	 * @param model is current model
	 * @param _id is _id of entity model need to get
	 * @param isActive is value need to update*/
	async $setIsActive(model, _id, isActive) {
		return await model.updateOne({_id}, {$set: {isActive}});
	}

	/** Set isDelete prop of a entity model
	 * @output object mongo result updating
	 * @param model is current model
	 * @param _id is _id of entity model need to get
	 * @param isDelete is value need to update*/
	async $setIsDelete(model, _id, isDelete) {
		return await model.updateOne({_id}, {$set: {isDelete}});
	}

	/** Get a entity model via code prop
	 * @output object entity model
	 * @param model is current model
	 * @param code is value need to query
	 * @param select is object contain props name need to get
	 * @param isWithOutCheckDelete type boolean*/
	async $getByCode(model, code, select = {}, isWithOutCheckDelete = false) {
		const filter = {
			code: new RegExp(`^${code}$`, "i")
		};
		const result = await model.findOne(filter, select);
		if (!result || _.isEmpty(result)) {
			return {};
		}
		const data = result.toObject();
		if (data && data.isDelete && !isWithOutCheckDelete) {
			return {};
		}
		return data ? data : {};
	}

	/** Get list entity model were set isDelete is true
	 * @output list object entity model
	 * @param model is current model
	 * @param filter object contains more query props
	 * @param sort object contains sort props*/
	async $getAllDeleteItems(model, filter = {}, sort = {}) {
		filter.isDelete = true;
		return await model.find(filter, sort).lean();
	}

	/** Count number of entity model
	 * @output number records entity model
	 * @param model is current model working
	 * @param filter is contain query props*/
	async $count(model, filter = {}) {
		return await model.count(filter);
	}

	async $saveMany(model, listItem) {
		return model.insertMany(listItem);
	}

	/** Convert value to mongoId
	 * @output array _id or _id
	 * @param params array value or string value*/
	convertToMongoId(params) {
		if (_.isArray(params)) {
			return params.map((id) => mongoose.Types.ObjectId(id));
		} if (_.isString(params)) {
			return mongoose.Types.ObjectId(params);
		}
		return params;
	}


}

module.exports = MongoFuncHelper;
