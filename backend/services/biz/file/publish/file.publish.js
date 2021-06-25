const _ = require("lodash");
const { FileLogic, FilePrivateLogic } = require("../logics");

class FilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.fileLogic = new FileLogic(mainProcess);
		this.filePrivateLogic = new FilePrivateLogic(mainProcess);
	}

	/** Mobile publish action: Upload file original use for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	uploadFile(ctx) {
		return this.fileLogic.upload(ctx);
	}

	/** Mobile publish action: Upload file image 360 use for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	uploadFile360(ctx) {
		return this.fileLogic.uploadImg360(ctx);
	}

	/** Mobile publish action: Get public original file use for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	getFile(ctx) {
		return this.fileLogic.get(ctx);
	}

	/** Mobile publish action: Get private original file use for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	getPrivateFile(ctx) {
		return this.filePrivateLogic.get(ctx);
	}

	/** Mobile publish action: Get public thumbnail file use for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	getFileThumbnail(ctx) {
		return this.fileLogic.getThumbnail(ctx);
	}

	/** Mobile publish action: Get private thumbnail file use for mobile app
	 * @param ctx: context request
	 * @output object: {code, data, message}
	 */
	getPrivateFileThumbnail(ctx) {
		return this.filePrivateLogic.getThumbnail(ctx);
	}
}

module.exports = FilePublish;