const DB_COLLECTION = {
	FILE: "files"
};
const DEFAULT_LANGUAGE_CODE = "vi";
const FILE_CONFIG = {
	VALIDATION: {
		FILE_TYPE: {
			IMAGE: [
				{mimeType: "image/jpeg", extension: ["jpg", "jpeg"]},
				{mimeType: "image/gif", extension: ["gif"]},
				{mimeType: "image/png", extension: ["png"]},
				{mimeType: "image/vnd.microsoft.icon", extension: ["ico"]},
			],
			VIDEO: [
				{mimeType: "video/mp4", extension: ["mp4"]},
			],
			DOCUMENT: [
				{mimeType: "application/msword", extension: ["doc", "dot"]},
				{mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: ["docx"]},
				{mimeType: "application/vnd.ms-excel", extension: ["xls", "xlt", "xla"]},
				{mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: ["xlsx"]},
				{mimeType: "application/pdf", extension: ["pdf"]},
				{mimeType: "text/csv", extension: ["csv"]},
			]
		},
		MAX_FILE_SIZE: {
			IMAGE: 1,
			VIDEO: 50,
			DOCUMENTS: 100,
			IMAGE360: 3
		}
	}
};

module.exports = {
	DB_COLLECTION,
	DEFAULT_LANGUAGE_CODE,
	FILE_CONFIG
};
