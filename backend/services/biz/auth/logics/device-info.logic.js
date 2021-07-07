const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { CoreHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");

class DeviceInfoLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.deviceInfoModel = this.models.DeviceInfoModel;
	}

	/** Logic: Get all customer
	 * @output Promise<T> {code, data, message}
	 */
	getList() {
		return new Promise((res, rej) => {
			this.deviceInfoModel.list()
				.then((result) => res(super.resInfo(result)))
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}
	async getLogBySession(session){
		return this.deviceInfoModel.findOne({session});
	}

	async createDeviceInfo(deviveInfo) {
		if (!deviveInfo) {
			return null;
		}
		this.deviceInfoModel.create(deviveInfo);
	}

}

module.exports = DeviceInfoLogic;
