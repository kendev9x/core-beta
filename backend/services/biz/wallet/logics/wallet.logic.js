/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require("lodash");
const BaseLogic = require("./base.logic");
const { ResponseHelper, RequestHelper } = require("../../../../libs/helpers");
const SqlDb = require("../dbHandler/sqlDb");
const NidConnector = require("../../../../connectors/nid/nid.connector");

class WalletLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.cashWalletModel = this.models.CashWalletModel;
		this.coreSql = this.models.CoreSQLModel;
		this.sqlDB = new SqlDb(mainProcess);
		this.nidConnector = new NidConnector(mainProcess);

	}

	async getWalletByCustomerId(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.customerId) {
				return ResponseHelper.resErr(400, "Bad request", 400);
			}

			const walletExisted = await this.coreSql.getWalletByCustomerId(params.customerId);
			if (walletExisted) {
				return ResponseHelper.resInfo(walletExisted);
			}
			return ResponseHelper.resInfo(walletExisted);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}

    async getWalletById(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.customerId || !params.groupWalletId) {
				return ResponseHelper.resErr(400, "Bad request", 400);
			}

			const walletExisted = await this.coreSql.getWalletById(params.groupWalletId, params.customerId);
			if (walletExisted) {
				return ResponseHelper.resInfo(walletExisted);
			}
			return ResponseHelper.resInfo(walletExisted);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}

    async getListWallet(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
            const {code, customerId, skip, take} = params;
			const walletExisted = await this.coreSql.getListWallet(code, customerId, skip, take);
			if (walletExisted) {
				return ResponseHelper.resInfo(walletExisted);
			}
			return ResponseHelper.resInfo(walletExisted);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}

	async getTransactionByWalletId(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.walletId) {
				return ResponseHelper.resErr(400, "Bad request", 400);
			}

			const transactions = await this.coreSql.getTransactionByWalletId(params.walletId);
			if (transactions) {
				return ResponseHelper.resInfo(transactions);
			}
			return ResponseHelper.resInfo(transactions);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}

	async getTransactionByCustomerId(context) {
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.customerId) {
				return ResponseHelper.resErr(400, "Bad request", 400);
			}

			const transactions = await this.coreSql.getTransactionByCustomerId(params.customerId);
			if (transactions) {
				return ResponseHelper.resInfo(transactions);
			}
			return ResponseHelper.resInfo(transactions);
		} catch (e) {
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}
}

module.exports = WalletLogic;
