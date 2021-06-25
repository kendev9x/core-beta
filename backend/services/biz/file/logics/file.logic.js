const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const mkdir = require("mkdirp").sync;
const ResCode = require("../../../../defined/response-code");
const { RequestHelper, ResponseHelper, FunctionHelper } = require("../../../../libs/helpers");
const { APP_SETTING, MIME_TYPE } = require("../defined");
const BaseLogic = require("./base.logic");

/** Making root folder will to ignore if root folder existed */
const uploadDir = path.join(process.env.UPLOAD_FILE || __dirname);
const thumbnailDir = path.join(process.env.UPLOAD_FILE || __dirname, "thumbnails");
mkdir(uploadDir);
mkdir(thumbnailDir);

class FileLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
	}

	/** POST A FILE UPLOAD
	 * @param ctx
	 * @output object: {code, data, message} */
	async upload(ctx) {
		const langCode = RequestHelper.getLanguageCode(ctx);
		return new Promise((resolve, reject) => {
			if (!ctx.meta.filename) {
				reject(ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.MISSING_FILE_NAME, null, langCode));
			}
			/** Get mimeType from file request */
			const mimeType = ctx.meta.mimetype;
			/** Get file extension from file request */
			const splitFileNameArr = ctx.meta.filename.split(".");
			const extension = _.last(splitFileNameArr);
			/** Check file upload is image file */
			const isFileImage = APP_SETTING.FILE_CONFIG.VALIDATION.FILE_TYPE.IMAGE
				.findIndex((type) => type.mimeType === mimeType
					&& type.extension.findIndex((ext) => ext === extension) >= 0) >= 0;

			const fileUploadInfo = this.processFileUpload(ctx, uploadDir);
			const {filePath, filename, fileUpload} = fileUploadInfo;
			const f = fs.createWriteStream(fileUploadInfo.filePath);
			ctx.params.pipe(f);
			f.on("close", () => {
				/** Validation file size image */
				this.validFileUpload(ctx, fs, filePath)
					.then(() => {
						/** File upload is image so process thumbnail */
						if (isFileImage) {
							this.processThumbnailImage(thumbnailDir, filePath, filename);
							this.processThumbnailImage(thumbnailDir, filePath, filename, "", "2x");
						}
						resolve(ResponseHelper.resInfo(fileUpload));
					})
					.catch((err) => {
						this.mainProcess.logger.error(err);
						reject(ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.VALIDATION_FAILED, null, langCode));
					});
			});
			f.on("error", (err) => {
				fs.unlinkSync(filePath);
				this.mainProcess.logger.error(err);
				reject(ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.VALIDATION_FAILED, null, langCode));
			});
		});
	}

	/** POST A FILE UPLOAD IMAGE 360
	 * @param ctx
	 * @output object: {code, data, message} */
	async uploadImg360(ctx) {
		const langCode = RequestHelper.getLanguageCode(ctx);
		return new Promise((resolve, reject) => {
			if (!ctx.meta.filename) {
				reject(ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.MISSING_FILE_NAME, null, langCode));
			}
			/** Get mimeType from file request */
			const mimeType = ctx.meta.mimetype;
			/** Get file extension from file request */
			const splitFileNameArr = ctx.meta.filename.split(".");
			const extension = _.last(splitFileNameArr);
			/** Check file upload is image file */
			const isFileImage = APP_SETTING.FILE_CONFIG.VALIDATION.FILE_TYPE.IMAGE
				.findIndex((type) => type.mimeType === mimeType
					&& type.extension.findIndex((ext) => ext === extension) >= 0) >= 0;
			const fileUploadInfo = this.processFileUpload(ctx, uploadDir);
			const {filePath, filename, fileUpload} = fileUploadInfo;
			const f = fs.createWriteStream(filePath);
			ctx.params.pipe(f);
			if (isFileImage) {
				f.on("close", () => {
					/** Validation file size image */
					this.validFileUpload(ctx, fs, filePath, true)
						.then(() => {
							/** file upload is image so process thumbnail */
							if (isFileImage) {
								this.processThumbnailImage(thumbnailDir, filePath, filename);
								this.processThumbnailImage(thumbnailDir, filePath, filename, "", "2x");
							}
							resolve(ResponseHelper.resInfo(fileUpload));
						})
						.catch((err) => {
							this.mainProcess.logger.error(err);
							reject(ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.VALIDATION_FAILED, null, langCode));
						});
				});
			} else {
				reject(Error("file type is not image"));
			}
			f.on("error", (err) => {
				fs.unlinkSync(filePath);
				this.mainProcess.logger.error(err);
				reject(ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.VALIDATION_FAILED, null, langCode));
			});
		});
	}

	/** GET A FILE ORIGINAL
	 * @param ctx
	 * @output object: {code, data, message} */
	async get(ctx) {
		/** id is fileName or absolute path */
		const langCode = RequestHelper.getLanguageCode(ctx);
		const {id} = ctx.params;
		if (!id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		let filePath = "";
		/** Detect file name and try finding file with new logic ===> saved in folder with date upload */
		const partFileNameArr = id.split("-");
		if (partFileNameArr && partFileNameArr.length > 0) {
			filePath = path.join(uploadDir, partFileNameArr[0], id);
		}
		/** If file not found with new structure folder saved ===> file uploaded with old logic (contains at root file) */
		if (!fs.existsSync(filePath)) {
			filePath = path.join(uploadDir, id);
		}
		/** If still not found file */
		if (!fs.existsSync(filePath)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.FILE.FILE_NOT_FOUND, null, langCode);
		}
		/** Set file result to return client */
		ctx.meta.$responseType = MIME_TYPE.getMimeType(id.split(".").pop());
		return fs.createReadStream(filePath);
	}

	/** GET A FILE THUMBNAIL
	 * @param ctx
	 * @output object: {code, data, message} */
	async getThumbnail(ctx) {
		/** Id is fileName */
		const langCode = RequestHelper.getLanguageCode(ctx);
		const {id} = ctx.params;
		if (!id) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}
		let filePath = "";
		let folderPath = "";
		let originalName = id;
		let versionThumbnail = "1x";
		/** Detect file name and try finding file with new logic ===> saved in folder with date upload */
		const partFileNameArr = id.split("-");
		const partVersionThumbs = id.split("@");
		if (partFileNameArr && partFileNameArr.length > 0) {
			if (partFileNameArr[0].indexOf("x@") >= 0) {
				const partFileNameArrVersionArr = partFileNameArr[0].split("@");
				if (partFileNameArrVersionArr && partFileNameArrVersionArr.length > 0) {
					// eslint-disable-next-line prefer-destructuring
					partFileNameArr[0] = partFileNameArrVersionArr[1];
					// eslint-disable-next-line prefer-destructuring
					originalName = partVersionThumbs[1];
					// eslint-disable-next-line prefer-destructuring
					versionThumbnail = partVersionThumbs[0];
				}
			}
			filePath = path.join(thumbnailDir, partFileNameArr[0], id);
		}
		let stepCheck = 0;
		/** if file not exists in folder date  ===> try get from parent upload folder (case old file uploaded) */
		if (!fs.existsSync(filePath)) {
			filePath = path.join(thumbnailDir, id);
			stepCheck = 1;
		}

		/** if still not found file thumbnail ==> get original for this case with new logic */
		if (!fs.existsSync(filePath)) {
			/** find file in sub folder date */
			filePath = path.join(uploadDir, partFileNameArr[0], originalName);
			folderPath = path.join(thumbnailDir, partFileNameArr[0]);
			stepCheck = 2;
		}

		/** if file original not exists in sub folder ==> case: files uploaded before implement logic create sub folder */
		if (!fs.existsSync(filePath)) {
			filePath = path.join(uploadDir, id);
			folderPath = thumbnailDir;
			stepCheck = 3;
		}

		/** if still can not find ==> of course file not exists in system */
		if (!fs.existsSync(filePath)) {
			return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.COMMON.MISSING_PARAM, null, langCode);
		}

		/** If file thumbnail not exists so create thumbnail for this case */
		if (stepCheck === 2 || stepCheck === 3) {
			await this.processThumbnailImage(thumbnailDir, filePath, originalName, folderPath, versionThumbnail);
		}

		/** set file result to return client */
		ctx.meta.$responseType = MIME_TYPE.getMimeType(id.split(".").pop());
		return fs.createReadStream(filePath);
	}
}

module.exports = FileLogic;