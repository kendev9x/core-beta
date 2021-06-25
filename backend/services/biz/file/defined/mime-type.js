const mimeType = {};

/**
 *File mapping mine types for action get
 */

/** Images * */
mimeType[exports.apng = "apng"] = "image/apng";
mimeType[exports.bmp = "bmp"] = "image/bmp";
mimeType[exports.gif = "gif"] = "image/gif";
mimeType[exports.ico = "ico"] = "image/x-icon";
mimeType[exports.cur = "cur"] = "image/x-icon";
mimeType[exports.jpg = "jpg"] = "image/jpeg";
mimeType[exports.jpeg = "jpeg"] = "image/jpeg";
mimeType[exports.jfif = "jfif"] = "image/jpeg";
mimeType[exports.pjpeg = "pjpeg"] = "image/jpeg";
mimeType[exports.pjp = "pjp"] = "image/jpeg";
mimeType[exports.png = "png"] = "image/png";
mimeType[exports.svg = "svg"] = "image/svg+xml";
mimeType[exports.tif = "tif"] = "image/tiff";
mimeType[exports.tiff = "tiff"] = "image/tiff";
mimeType[exports.webp = "webp"] = "image/webp";

/** Documents * */
mimeType[exports.doc = "doc"] = "application/msword";
mimeType[exports.docx = "docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
mimeType[exports.xls = "xls"] = "application/vnd.ms-excel";
mimeType[exports.xlsx = "xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
mimeType[exports.pdf = "pdf"] = "application/pdf";
mimeType[exports.csv = "csv"] = "text/csv";

/** Documents * */
mimeType[exports.mp4 = "mp4"] = "video/mp4";

exports.getMimeType = (extension) => {
	// eslint-disable-next-line no-prototype-builtins
	if (mimeType.hasOwnProperty(extension)) {
		return mimeType[extension];
	}
	throw new Error(`Does not exist: ${extension}`);
};
