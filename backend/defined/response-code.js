const {StatusCodes} = require("http-status-codes");
/** Define status codes about business logic at file json */
const ResCodeCommon = require("./response-codes/common.json");
const ResCodeAccount = require("./response-codes/account.service.json");
const ResCodeAuth = require("./response-codes/auth.service.json");
const ResCodeProduct = require("./response-codes/product.service.json");
const ResCodeCms = require("./response-codes/cms.service.json");
const ResCodeWallet = require("./response-codes/wallet.service.json");
const ResCodePromotion = require("./response-codes/promotion.service.json");
const ResCodeApproval = require("./response-codes/approval.service.json");
const ResCodeFile = require("./response-codes/file.service.json");

module.exports = {
	SYS_STATUS_CODE: StatusCodes,
	BIZ_STATUS_CODE: {
		COMMON: ResCodeCommon,
		ACCOUNT: ResCodeAccount,
		AUTH: ResCodeAuth,
		PRODUCT: ResCodeProduct,
		CMS: ResCodeCms,
		WALLET: ResCodeWallet,
		PROMOTION: ResCodePromotion,
		APPROVAL: ResCodeApproval,
		FILE: ResCodeFile
	}
};