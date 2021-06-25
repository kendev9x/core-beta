const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const mkdir = require("mkdirp").sync;
const sharp = require("sharp");
const { FunctionHelper } = require("../../../../libs/helpers");
const { APP_SETTING } = require("../defined");

class BaseLogic {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
	}

	/** PRIVATE FUNC PROCESSING */
	processFileUpload(ctx, uploadDir) {
		const originalFileName = ctx.meta.filename.split(".")[0];
		const fileType = ctx.meta.filename.split(".").pop().toLowerCase();
		const currentDateFrm = FunctionHelper.getCurrentDateByFormat(Date.now(), "yyyymmdd");
		const currentDateTimeFrm = FunctionHelper.getCurrentDateByFormat(Date.now(), "yyyymmdd-hhMMss");
		const genNumDigit = FunctionHelper.generateRandomNumber(4);
		const filename = `${currentDateTimeFrm}-${genNumDigit}-${originalFileName}.${fileType}`;
		const folderSave = path.join(uploadDir, currentDateFrm);
		const filePath = path.join(folderSave, filename);
		mkdir(folderSave);
		const fileUpload = {
			filename,
			// TODO: meta information file need not return client, client only need file name (absolute path) for set to field
			meta: {
				fieldname: ctx.meta.fieldname,
				filename: ctx.meta.filename,
				encoding: ctx.meta.encoding,
				mimetype: ctx.meta.mimetype
			}
		};
		return {
			filename,
			filePath,
			fileUpload
		};
	}

	processThumbnailImage(thumbnailDir, originalFilePath, fileName,
		folderPathThumbnailCreate = "", thumbnailVersion = "1x") {
		return new Promise((resolve, reject) => {
			const minWidth = thumbnailVersion === "1x" ? 360 : 720;
			const minHeight = thumbnailVersion === "1x" ? 360 : 720;
			sharp(originalFilePath).metadata().then((fileInfo) => {
				/** If file upload is image so will check and process create thumbnail
         Width 360 is min width for image display at mobile app */
				const width = fileInfo.width > minWidth ? minWidth : fileInfo.width;
				const height = fileInfo.height > minHeight ? minHeight : fileInfo.height;
				const resizeConf = fileInfo.width >= fileInfo.height
					? {width: parseInt(width, 10), withoutEnlargement: true}
					: {height: parseInt(height, 10), withoutEnlargement: true};
				let thumbnailPath;
				if (!folderPathThumbnailCreate || folderPathThumbnailCreate === "") {
					const currentDateFrm = FunctionHelper.getCurrentDateByFormat(Date.now(), "yyyymmdd");
					thumbnailPath = path.join(thumbnailDir, currentDateFrm);
				} else {
					thumbnailPath = folderPathThumbnailCreate;
				}
				mkdir(thumbnailPath);
				const fullFileThumbnailPath = `${thumbnailPath}/${thumbnailVersion}@${fileName}`;
				sharp(originalFilePath).resize(resizeConf)
					.toFile(fullFileThumbnailPath, (err, resizeImage) => {
						if (err) {
							this.logger.error(err);
							return reject(err);
						}
						return resolve({
							path: fullFileThumbnailPath,
							info: resizeImage
						});
					});
			}).catch((err) => {
				this.logger.error(JSON.stringify(err));
				return reject(err);
			});
		});
	}
	/** END */

	/** PRIVATE FUNC VALIDATION */
	validFileUpload(ctx, fileStream, filePath, isUploadFile360 = false) {
		return new Promise((resolve, reject) => {
			// Check file type upload
			// Get mimeType from file request
			const mimeType = ctx.meta.mimetype;
			// Get file extension from file request
			const splitFileNameArr = ctx.meta.filename.split(".");
			const extension = _.last(splitFileNameArr);
			const isFileImage = APP_SETTING.FILE_CONFIG.VALIDATION.FILE_TYPE.IMAGE
				.findIndex((type) => type.mimeType === mimeType
					&& type.extension.findIndex((ext) => ext === extension) >= 0) >= 0;
			const isFileVideo = APP_SETTING.FILE_CONFIG.VALIDATION.FILE_TYPE.VIDEO
				.findIndex((type) => type.mimeType === mimeType
					&& type.extension.findIndex((ext) => ext === extension) >= 0) >= 0;
			const isFileDocument = APP_SETTING.FILE_CONFIG.VALIDATION.FILE_TYPE.DOCUMENT
				.findIndex((type) => type.mimeType === mimeType
					&& type.extension.findIndex((ext) => ext === extension) >= 0) >= 0;
			let maximumFileSize = 0;
			if (isFileImage) {
				maximumFileSize = APP_SETTING.FILE_CONFIG.VALIDATION.MAX_FILE_SIZE.IMAGE;
			} else if (isFileVideo) {
				maximumFileSize = APP_SETTING.FILE_CONFIG.VALIDATION.MAX_FILE_SIZE.VIDEO;
			} else if (isFileDocument) {
				maximumFileSize = APP_SETTING.FILE_CONFIG.VALIDATION.MAX_FILE_SIZE.DOCUMENTS;
			} else {
				return reject(Error(`${
					ctx.meta.filename} is not support. mimeType ${mimeType} and extension ${extension} not correct `));
			}
			const stat = fs.statSync(filePath);
			const fileSize = this.convertLengthToSize(stat.size);
			if (fileSize.mb > maximumFileSize && !isUploadFile360) {
				return reject(Error(`${
					ctx.meta.filename} is exceed file size MB. File ${ctx.meta.mimetype} limit to upload is ${
					maximumFileSize} MB!`));
			} if (isUploadFile360 && fileSize.mb > APP_SETTING.FILE_CONFIG.VALIDATION.MAX_FILE_SIZE.IMAGE360) {
				return reject(Error(`${
					ctx.meta.filename} is exceed file size MB. File ${ctx.meta.mimetype} limit to upload is ${APP_SETTING.FILE_CONFIG.VALIDATION.MAX_FILE_SIZE.IMAGE360} MB!`));
			}
			return resolve(true);
		});
	}

	convertLengthToSize(contentLength) {
		if (!_.isNumber(parseFloat(contentLength)) || contentLength < 1) {
			throw Error("File cannot detect size or file interrupted");
		}
		const kb = parseFloat(contentLength) / 1024;
		const mb = kb / 1024;
		return {
			kb: parseFloat(kb.toFixed(2)),
			mb: parseFloat(mb.toFixed(2))
		};
	}
	/** END */
}

module.exports = BaseLogic;