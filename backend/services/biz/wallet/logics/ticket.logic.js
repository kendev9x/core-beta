/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require("lodash");
const BaseLogic = require("./base.logic");
const { ResponseHelper, RequestHelper} = require("../../../../libs/helpers");
const NidConnector = require("../../../../connectors/nid/nid.connector");
const SqlDb = require("../dbHandler/sqlDb");
const { parseInt } = require("lodash");
const ResCode = require("../../../../defined/response-code");

class TicketLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.coreSql = this.models.CoreSQLModel;
		this.ticketModel = this.models.TicketModel;
		this.nidConnector = new NidConnector(mainProcess);
		this.coreSql = this.models.CoreSQLModel;
		this.cashWalletModel = this.models.CashWalletModel;
		this.bonusWalletModel = this.models.BonusWalletModel;

	}

	async genTicketCode(){
		const lastTicket = await this.ticketModel.getLastTicket();
		let lastCode  = 0;
		if (lastTicket && !_.isEmpty(lastTicket)) {
			lastCode = lastTicket.code;
			lastCode = lastCode.replace("TK","0");
		}
		lastCode = "TK" + _.padStart((parseInt(lastCode)+1).toString(), 10, "0");
		return lastCode;
	}

	async rejectTicket(context){
		try {
			const params = RequestHelper.getParamsByMethodType(context);
			if (!params || !params.customerId || !params.ticketCode) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.TICKET.MISSING_PARAM);
			}
			const cashWallet = await this.cashWalletModel.findOne({ticketCode: params.ticketCode, customerId: params.customerId, status: "PENDING"});
			if (cashWallet && !_.isEmpty(cashWallet)) {
				await this.cashWalletModel.updateOne({ticketCode: params.ticketCode, customerId: params.customerId, status: "PENDING"}, {status: "CASHBACK"});
				await this.coreSql.createTransaction(cashWallet.walletId, "TCHM", "CASHBACK", cashWallet.amount, cashWallet.ticketCode, cashWallet.content);
			}

			const bonusWallet = await this.bonusWalletModel.findOne({ticketCode: params.ticketCode, customerId: params.customerId, status: "PENDING"});
			if (bonusWallet && !_.isEmpty(bonusWallet)) {
				await this.bonusWalletModel.updateOne({ticketCode: params.ticketCode, customerId: params.customerId, status: "PENDING"}, {status: "CASHBACK"});
				await this.coreSql.createTransaction(bonusWallet.walletId, "TCBN", "CASHBACK", bonusWallet.amount, bonusWallet.ticketCode, bonusWallet.content);
			}

			await this.ticketModel.updateOne({code: params.ticketCode, customerId: params.customerId, status: "PENDING"}, {status: "REJECT"});
			return ResponseHelper.resInfo(params);

		} catch (error) {
			console.log("error", error);
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	

	}
	async saveWalletHistory(type, pocketWallet, ticketCode, content, amount){
		const walletHistory = {
			customerId: pocketWallet.customerId, ticketCode, amount ,content, status: "PENDING", walletId: pocketWallet._id		
		};
		if(type === "CASH"){
			await this.cashWalletModel.create(walletHistory);
		}else{
			await this.bonusWalletModel.create(walletHistory);

		}
	}
	async makeTransaction(point, cashPocket, bonusPocket, ticketCode, content){
		if (point > parseInt(cashPocket.curBalance) + parseInt(bonusPocket.curBalance)) {
			return false;
		}
		if (point <= parseInt(cashPocket.curBalance)) {
			//tranfer cash only
			const txData = await this.coreSql.createTransaction(cashPocket._id, "TKHM", "BUY", point, ticketCode, content);
			console.log("data", txData);

			await this.saveWalletHistory("CASH", cashPocket, ticketCode, content, point);
			return true;
		}
		const transferCash = parseInt(cashPocket.curBalance);
		const txData1 = await this.coreSql.createTransaction(cashPocket._id, "TKHM", "BUY", transferCash, ticketCode, content);
		console.log("data1", txData1);
		await this.saveWalletHistory("CASH", cashPocket, ticketCode, content, transferCash);

		const transferBonus = point - transferCash;
		const txData2 = await this.coreSql.createTransaction(bonusPocket._id, "TKBN", "BUY", transferBonus, ticketCode, content);
		console.log("data2", txData2);
		await this.saveWalletHistory("BONUS", bonusPocket, ticketCode, content, transferBonus);

		return true;
		//transfer cash + transfer bonus
	}

	async checkBalanceAndMakeTransaction(customerId, point, ticketCode, content){
		const walletExisted = await this.coreSql.getWalletByCustomerId(customerId);
		if (walletExisted ) {
			console.log("walletExisted", walletExisted);
			const balance = parseInt(walletExisted[0].curBalance) +  parseInt(walletExisted[1].curBalance);
			console.log("current balance and point request ", balance, point);
			return await this.makeTransaction(point, walletExisted[1], walletExisted[0], ticketCode, content);
		}
		return false;
	}

	async createBamTicket(context){
		try {
			const ticketCode = await this.genTicketCode();
			const params = RequestHelper.getParamsByMethodType(context);
			const resultTx = await this.checkBalanceAndMakeTransaction(params.customerId, params.points, ticketCode, params.content);
			if (!resultTx) {
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.WALLET.TICKET.BALANCE_INSURFICENT);
			}
			if (!params || !params.customerId || !params.content || !params.points || !params.schedule_from || !params.schedule_to) {
				console.log("params", params);
				return ResponseHelper.resFailed(ResCode.BIZ_STATUS_CODE.WALLET.TICKET.MISSING_PARAM);
			}
			const entity = params;
			entity.code = ticketCode;
			entity.status = "PENDING";
			console.log("ticketCode", ticketCode);
			const ticket = await this.ticketModel.create(entity);
			return ResponseHelper.resInfo(ticket);

		} catch (e) {
			console.log(e);
			return ResponseHelper.resErr(506, "Process Failed", 507);
		}
	}

}

module.exports = TicketLogic;
