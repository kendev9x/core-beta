const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { NovaHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");

class AuthLogLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.authLogModel = this.models.AuthLogModel;
	}

	/** Logic: Get all customer
	 * @output Promise<T> {code, data, message}
	 */
	getList() {
		return new Promise((res, rej) => {
			this.authLogModel.list()
				.then((result) => res(super.resInfo(result)))
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}
	async getLogBySession(session){
		return this.authLogModel.findOne({session});
	}

	async createAuthLog(logItem) {
		if (!logItem) {
			return null;
		}
		return this.authLogModel.create(logItem);
	}

	async getLogs(filter){
		return this.authLogModel.getAll(filter);

	}
}

module.exports = AuthLogLogic;
