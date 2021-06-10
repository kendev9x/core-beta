const _ = require("lodash");
const { RequestHelper } = require("../../../../libs/helpers");
const ResponseCode = require("../../../../defined/response-code");
const BaseLogic = require("./base.logic");

class UserActivityLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.userActivityModel = this.models.UserActivityModel;
	}

	/** Logic: Get all user activities -- just use for testing
	 * @output Promise<T> {code, data, message}
	 */
	getListUserActivity(ctx) {
		const params = RequestHelper.getParamsByMethodType(ctx);
		const filter = {};
		if (params.service) {
			filter.service = params.service;
		}
		if (params.action) {
			filter.action = params.action;
		}
		if (params.username) {
			filter.username = params.username;
		}

		const sort = {};
		if (params.sortBy && params.sortType) {
			sort[`${params.sortBy}`] = parseInt(params.sortType, 10);
		}
		return new Promise((res, rej) => {
			this.userActivityModel.listPaging(filter, sort, params.pageNumber, params.pageSize)
				.then((result) => res(super.resInfo(result)))
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}

	/**
	 * Logic: The function to create tracking user activity
	 * @param userActivityParam context request
	 * @description userActivityParam.username is current user login
	 * @description userActivityParam.service is processing service name
	 * @description userActivityParam.action is processing action name
	 * @description userActivityParam.data is object data insert, updated or delete
	 * @output {Promise<T>} {code, data, message}
	 */
	createActivity(userActivityParam) {
		return new Promise((res, rej) => {
			if (!userActivityParam || _.isEmpty(userActivityParam)) {
				rej(super.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, new Error("Missing params")));
			}
			// if (_.isEmpty(userActivityParam.username)) {
			// 	rej(super.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, "Missing params"));
			// }
			if (_.isEmpty(userActivityParam.service)) {
				rej(super.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, new Error("Missing params service")));
			}
			if (_.isEmpty(userActivityParam.action)) {
				rej(super.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, new Error("Missing params action")));
			}
			this.userActivityModel.create(userActivityParam)
				.then((result) => {
					if (!result._id) {
						rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, new Error("Save data unsuccessful")));
					}
					res(super.resInfo(true));
				})
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}

}

module.exports = UserActivityLogic;
