const appSetting = require("../../defined/app-setting");

class BaseTransfer {
	constructor(languageCode) {
		if (!languageCode) this.languageCode = appSetting.DEFAULT_LANGUAGE_CODE;
		else this.languageCode = languageCode;
	}

	translateContentGetValue(contentObj) {
		if (!contentObj) {
			return "";
		}
		const content = contentObj[this.languageCode];
		let dataText = "";
		if (content === undefined || content === "") {
			dataText = contentObj.vi;
		} else {
			return content;
		}
		if (dataText === undefined) {
			dataText = contentObj;
		}
		return dataText;
	}

	translateContent(contentObj) {
		if (!contentObj) {
			return contentObj;
		}
		const dataReturn = {};
		if (contentObj[this.languageCode] == null || contentObj[this.languageCode] === undefined
			|| contentObj[this.languageCode] === "" || Object.keys(contentObj).length < 1) {
			dataReturn[this.languageCode] = contentObj;
			return dataReturn;
		}
		dataReturn[this.languageCode] = contentObj[this.languageCode];
		return dataReturn;
	}

	translateDynamicObj(dynamicObj, type) {
		if (!dynamicObj) {
			return dynamicObj;
		}
		if (Array.isArray(dynamicObj)) {
			dynamicObj = dynamicObj.map((obj) => {
				obj = this.translateContent(obj);
				return obj;
			});
		} else if (typeof dynamicObj === "object"
			&& (type.toUpperCase() === "TEXT" || type.toUpperCase() === "TEXTEDITOR")) {
			dynamicObj = this.translateContent(dynamicObj);
		}
		return dynamicObj;
	}
}

module.exports = BaseTransfer;
