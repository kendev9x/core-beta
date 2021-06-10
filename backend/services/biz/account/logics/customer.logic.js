const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { NovaHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");

class CustomerLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.customerModel = this.models.CustomerModel;
	}

	/** Logic: Get all customer
	 * @output Promise<T> {code, data, message}
	 */
	getList() {
		return new Promise((res, rej) => {
			this.customerModel.list()
				.then((result) => res(super.resInfo(result)))
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}

	/** Logic: Find by a phone
	 * @param phone
	 * @output Promise<T> {code, data, message}
	 */
	getByPhone(phone) {
		return new Promise((res, rej) => {
			this.customerModel.getByPhone(phone)
				.then((result) => {
					res(super.resInfo(result));
				}).catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}

	/**
	 * Logic: The function to create tracking user activity
	 * @param ctx context request
	 * @description ctx.params.body.username is current user login
	 * @description ctx.params.body.service is processing service name
	 * @description ctx.params.body.action is processing action name
	 * @description ctx.params.body.data is object data insert, updated or delete
	 * @output {Promise<T>} {code, data, message}
	 */
	createCustomer(ctx) {
		return new Promise((res, rej) => {
			const params = ctx.params;
			if (!params || _.isEmpty(params)) {
				rej(super.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, new Error("Missing params")));
			}
			this.customerModel.create(params)
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

module.exports = CustomerLogic;
