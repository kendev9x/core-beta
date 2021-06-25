/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const BaseLogic = require("./base.logic");
const XlsxStreamReader = require("xlsx-stream-reader");
const { ResponseHelper} = require("../../../../libs/helpers");
const SqlDb = require("../dbHandler/sqlDb");
const NidConnector = require("../../../../connectors/nid/nid.connector");

class CashWalletLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.cashWalletModel = this.models.CashWalletModel;
		this.coreSql = this.models.CoreSQLModel;
		this.sqlDB = new SqlDb(mainProcess);
		this.nidConnector = new NidConnector(mainProcess);

	}

	async getCustomerId(phoneNumber, identityType, identityNumber){
		try {
			const body = {phoneNumber, identityType, identityNumber};
		    const result = await this.nidConnector.callApi("customer/getCustomerIdForBam", "POST", body);
			let customerId;
			if (result.code === 200) {
				customerId = result.data;
			}
			return customerId;
			
		} catch (error) {
			this.logger.error(JSON.stringify(error));
			return null;
		}
		
	}
	
	async uploadBamCashs(ctx) {
		try {
			const model = this.cashWalletModel;
			const coreSql = this.coreSql;
			const uploadedUsers = [];
			const workBookReader = new XlsxStreamReader();
			const  bamCashLogic = new CashWalletLogic(this.mainProcess);

			ctx.params.pipe(workBookReader);
			return new Promise((res, rej) => {
				workBookReader.on("worksheet", function (workSheetReader) {
					if (workSheetReader.id > 1) {
						// we only want first sheet
						workSheetReader.skip();
						return;
					}
					// print worksheet name
					console.log(workSheetReader.name);

					// if we do not listen for rows we will only get end event
					// and have infor about the sheet like row count
					workSheetReader.on("row",  function (row) {
						if (row.attributes.r == 1) {
							// do something with row 1 like save as column names
						} else {
							const rawData = row.values.map((rowVal) => rowVal);
							if (!_.isEmpty(rawData[2])&&
							 !_.isEmpty(rawData[4]) && !_.isEmpty(rawData[5]) && !_.isEmpty(rawData[6])
							 && !_.isEmpty(rawData[7])&& !_.isEmpty(rawData[8])&& !_.isEmpty(rawData[9])
							 && !_.isEmpty(rawData[11])&& !_.isEmpty(rawData[12])&& !_.isEmpty(rawData[13])
							 && !_.isEmpty(rawData[14])&& !_.isEmpty(rawData[15])&& !_.isEmpty(rawData[16])&& !_.isEmpty(rawData[17])) {
								 const dateParts = rawData[17].split("/");
								 const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
								 let limit = rawData[15].replace(",", "");
								 limit = limit.replace(",", "");
								 const bamInfo = {
									 extends:{
										customerName: rawData[5], gender: rawData[6]
										, phone: rawData[7], identityType: rawData[8], identityNumber: rawData[9]
										, company: rawData[10], workPlace: rawData[11], position: rawData[12]
										, email: rawData[13], level: rawData[14]
										, supervisor: rawData[16]
									 }, amount: parseInt(limit), userId: rawData[4],  effectiveDate: dateObject,
									 businessCode: rawData[2], content: "Nạp hạn mức", status: "APPROVED"
								};
								uploadedUsers.push(bamInfo);
							}
						}
					});
					workSheetReader.on("end", async function () {
						console.log("uploadedUsers", uploadedUsers.length);
						// const dbConnection = await sql.createConnection();
						for (let index = 0; index < uploadedUsers.length; index++) {
							const user = uploadedUsers[index];

							const customerId = await bamCashLogic.getCustomerId(user.extends.phone, user.extends.identityType, user.extends.identityNumber);
							console.log("customerId", customerId);
							if (customerId) {
								user.customerId = customerId;

								const walletExisted = await coreSql.getWalletByCustomerId(user.customerId);
								let cashWallet;
								if (walletExisted && !_.isEmpty(walletExisted)) {
								//Create transaction
									cashWallet = walletExisted[1];
									console.log("walletExisted", cashWallet);
									const filter = {customerId: user.customerId, businessCode: user.businessCode, walletCode: cashWallet.code, effectiveDate: user.effectiveDate};
									const duplicateWallet = await model.findOne(filter);
									if (duplicateWallet && !_.isEmpty(duplicateWallet)) {
										console.log("duplicateWallet ---> no need create transaction");
									} else {
										console.log("create transaction");
										await  model.findOneAndUpdate(user, filter);
										await coreSql.createTransaction(cashWallet._id, user.businessCode, "BUDGET", user.amount, "0000000000", "Upload hạn mức cho BAM "+ user.extends.customerName);
									}
					
								} else {
									console.log("chưa có ví thì tạo ví cho", user.extends.customerName);
									// tạo ví
									const result = await coreSql.createWallet(user.customerId, user.extends.customerName);
									if (result && result.recordset && result.output.result === 1) {
										console.log("wallets", result.recordset);
										const wallets = result.recordset;
										if (wallets && wallets.length == 2) {
											//khi có wallet code thì lưu thông tin upload vào mongodb 
											user.walletCode = wallets[1].code;
											user.walletId = wallets[1]._id;

											const filter = {customerId: user.customerId, businessCode: user.businessCode, walletCode: user.walletCode, effectiveDate: user.effectiveDate};
											await  model.findOneAndUpdate(user, filter);
											cashWallet = wallets[1];
											await coreSql.createTransaction(cashWallet._id, user.businessCode, "BUDGET", user.amount, "0000000000", "Upload hạn mức cho BAM "+ user.extends.customerName);

										}
									}
								}
							//Tạo transaction
							}
						}
						res(ResponseHelper.resInfo(uploadedUsers.length + " bam limit uploaded!"));
					});
					// call process after registering handlers
					workSheetReader.process();
				});
				workBookReader.on("end", function () {
					console.log("uploadedUsers", uploadedUsers.length);
					res(ResponseHelper.resInfo(uploadedUsers.length + " bam uploaded!"));
				});
			});

		} catch (error) {
			ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, error.message, 400);
		}
	}
}

module.exports = CashWalletLogic;
