const randomize = require("randomatic");
const jsonDiff = require("json-diff");
const _ = require("lodash");
const mongoose = require("mongoose");
const dateFrm = require("dateformat");

/** Functions Helpers
 *
 */
class FunctionHelper {

	/** Convert string to unicode
	 * @param str string value
	 * @output string result
	 */
	convertUnicode(str) {
		try {
			return str.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.replace(/đ/g, "d").replace(/Đ/g, "D");
		} catch (e) {
			return "";
		}
	}

	/** Generate random a string with number format
	 * @param length numbers characters
	 * @param startString character start
	 * @param endString character end
	 * @param delimiter character delimiter
	 * @output string result
	 */
	generateRandomNumber(length, startString = "", endString = "", delimiter = "") {
		try {
			const numberGen = randomize("0", length, "");
			let result = "";
			if (!endString) {
				return `${startString}${delimiter}${numberGen}`;
			}
			result = `${startString}${delimiter}${numberGen}${delimiter}${endString}`;
			return result;
		} catch (e) {
			return "";
		}
	}

	/** Generate random a upper string
	 * @param length numbers characters
	 * @param startString character start
	 * @param endString character end
	 * @param delimiter character delimiter
	 * @output string result
	 */
	generateRandomUpperString(length, startString = "", endString = "", delimiter = "") {
		try {
			const stringGen = randomize("A", length, "");
			const result = `${startString}${delimiter}${stringGen}${delimiter}${endString}`;
			return result;
		} catch (e) {
			return "";
		}
	}

	/** Generate random a string with a patter
	 * @param pattern characters
	 * @param length numbers characters
	 * @param option numbers characters
	 * @param startString character start
	 * @param endString character end
	 * @param delimiter character delimiter
	 * @output string result
	 */
	generateRandomStringCustom(pattern, length, option = {}, startString = "", endString = "", delimiter = "") {
		try {
			const stringGen = randomize(pattern, length, option);
			return `${startString}${delimiter}${stringGen}${delimiter}${endString}`;
		} catch (e) {
			return "";
		}
	}

	/** Remove all space and special characters of a string
	 * @param text string value input
	 * @output string result
	 */
	removeAllSpaceAndSpecialChars(text) {
		try {
			const newString = text.replace(/[^A-Z0-9_]+/ig, "");
			return newString;
		} catch (e) {
			return "";
		}
	}

	/** Convert string to key code
	 * @param text string value input
	 * @output string result
	 */
	convertToKeyCode(text) {
		const str = this.convertUnicode(text);
		return this.removeAllSpaceAndSpecialChars(str);
	}

	/** Compare 2 json
	 * @param jsonObj object json need to compare
	 * @param compareJsonObj object json use to compare
	 * @output boolean value
	 */
	jsonCompare(jsonObj, compareJsonObj) {
		const result = jsonDiff.diffString(jsonObj, compareJsonObj);
		return !result;
	}

	/** Find a character in a string
	 * @param str string value input
	 * @param charToCount character need to find
	 * @output number value
	 */
	findOccurrences(str, charToCount) {
		return str.split(charToCount).length - 1;
	}

	/** Replace string with specific
	 * @param str string value input
	 * @param strRep value need to replace
	 * @param strRep value use to replace
	 * @output string replaced
	 */
	replaceString(str, strRep, repStr) {
		if (!str) {
			return "";
		}
		if (!strRep) {
			return str;
		}
		// const repE = new RegExp(strRep, "gi");
		const newStr = str.replace(new RegExp(strRep, "gi"), repStr);
		return newStr;
	}

	/** Get first character of string
	 * @param str string value input
	 * @output string result
	 */
	getFirstCharsOfString(str) {
		if (!str) {
			return "";
		}
		const strArr = str.split(" ");
		if (!strArr || !_.isArray(strArr) || strArr.length < 1) {
			return str;
		}
		let returnText = "";
		strArr.map((x) => {
			returnText += x.charAt(0);
			return x;
		});
		return returnText;
	}

	/** Trim all fields of a object or array objects
	 * @param obj dynamic value object or array object
	 * @output result
	 */
	trimDynamic(obj) {
		if (!Array.isArray(obj) && typeof obj !== "object") return obj;
		return Object.keys(obj).reduce((acc, key) => {
			acc[key.trim()] = typeof obj[key] === "string" ? obj[key].trim() : this.trimDynamic(obj[key]);
			return acc;
		}, Array.isArray(obj) ? [] : {});
	}

	/** Get current date format from date timestamp value
	 * @param date number timestamp
	 * @param dateFm
	 * @output result
	 */
	getCurrentDateByFormat(date = Date.now(), dateFm = "yyyymmdd-hhMMss") {
		try {
			return dateFrm(date, dateFm);
		} catch (e) {
			return "";
		}
	}

	/** Convert value to date
	 * @param inputParams number timestamp or string datetime
	 * @output result date object
	 */
	convertToDate(inputParams) {
		try {
			if (!inputParams) {
				return null;
			}
			const timeStamp = parseInt(inputParams, 10);
			if (_.isNumber(timeStamp)) {
				return new Date(timeStamp);
			}
			return new Date(inputParams);
		} catch (e) {
			return null;
		}
	}

	/** Convert string value to date
	 * @param strDate number timestamp or string datetime
	 * @param typeFrm format date
	 * @output result date object
	 */
	convertStringToDate(strDate, typeFrm = "yyyy-MM-dd") {
		try {
			if (!strDate) {
				return null;
			}
			const date = new Date(strDate);
			return date;
		} catch (e) {
			return null;
		}
	}

	/** Convert string value to number
	 * @param strNum string number value
	 * @output result number
	 */
	convertStringToNumber(strNum) {
		if (!strNum || _.isEmpty(strNum)) {
			return null;
		}
		// eslint-disable-next-line no-useless-escape
		return Number(strNum.replace(/[^0-9\.]+/g, ""));
	}

	/** Convert string value to number
	 * @param dateTime string or number timestamp
	 * @param numberDayAgo a number day will skip
	 * @param isOnlyGetDate just only get date need not time
	 * @output result date iso
	 */
	convertDateTimeToStringISO(dateTime, numberDayAgo = 0, isOnlyGetDate = true) {
		let strDate = "";
		if (_.isNumber(dateTime)) {
			dateTime = new Date(dateTime);
		}
		if (numberDayAgo && _.isNumber(numberDayAgo)) {
			dateTime = new Date(dateTime - numberDayAgo * (864e5)); // 864e5 == 86400000 == 24*60*60*1000
		}
		if (isOnlyGetDate) {
			dateTime = new Date(dateTime.setUTCHours(0, 0, 0, 0));
		}
		strDate = dateTime.toISOString();
		return strDate;
	}

	/** Validate string is format phone number
	 * @param strPhone string number value
	 * @output result boolean
	 */
	validPhoneNumber(strPhone) {
		const regex = /^[0-9]{10,11}$/;
		return regex.test(strPhone);
	}

	/** Convert a string to a phone number format
	 * @param strPhone string number value
	 * @output result string
	 */
	convertStringToPhone(strPhone) {
		if (strPhone.indexOf("/") > -1) {
			const strPhoneArr = strPhone.split("/");
			const strPhoneFirst = strPhoneArr[0];
			strPhone = strPhoneFirst;
		}
		let formatPhone = strPhone.replace(/ /g, "");
		formatPhone = formatPhone.replace(/^84/, "0");
		formatPhone = formatPhone.replace("+84", "0");
		formatPhone = formatPhone.replace("+84", "0");
		formatPhone = formatPhone.replace("+84(0)", "0");
		formatPhone = formatPhone.replace("(+84)", "0");
		formatPhone = formatPhone.replace("0(0)", "0");
		formatPhone = this.removeAllSpaceAndSpecialChars(formatPhone);
		return formatPhone;
	}

	/** Get date string format
	 * @param date string number value
	 * @output result string
	 */
	getDateStringFormat(date = null) {
		if (_.isNumber(date)) {
			return dateFrm(new Date(date), "yymdhMs");
		}
		if (date && _.isDate(date)) {
			return dateFrm(date, "yymdhMs");
		}
		return "";
	}

	/** Set content child properties by language code
	 * @param contentObj object data processing
	 * @param languageCode string language code
	 * @output object mapped value via language code */
	translateContent(contentObj, languageCode = "vi") {
		if (!contentObj) {
			return contentObj;
		}
		const dataReturn = {};
		if (contentObj[languageCode] == null || contentObj[languageCode] === undefined
			|| contentObj[languageCode] === "" || Object.keys(contentObj).length < 1) {
			dataReturn[languageCode] = contentObj;
			return dataReturn;
		}
		dataReturn[languageCode] = contentObj[languageCode];
		return dataReturn;
	}

	/** Convert value to mongoId
	 * @output array _id or _id
	 * @param params array value or string value */
	convertToMongoId(params) {
		if (_.isArray(params)) {
			return params.map((id) => mongoose.Types.ObjectId(id));
		} if (_.isString(params)) {
			return mongoose.Types.ObjectId(params);
		}
		return params;
	}

	/** Check input param is empty
	 * @param inputValue: param value need to checking
	 * @output true || false */
	isEmpty(inputValue) {
		if (typeof inputValue === "number") {
			return false;
		}
		if (typeof inputValue === "boolean") {
			return false;
		}
		if (!inputValue) {
			return true;
		}
		if (typeof inputValue === "object" && Object.keys(inputValue).length < 1) {
			return true;
		}
		return Array.isArray(inputValue) && inputValue.length < 1;
	}
}

module.exports = FunctionHelper;

// const test = Date.now();
// const funcHelper = new FunctionHelper();
// console.log(funcHelper.isEmpty(test));