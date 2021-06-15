/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const BaseLogic = require("./base.logic");
const XlsxStreamReader = require("xlsx-stream-reader");
const { ResponseHelper} = require("../../../../libs/helpers");
const SqlDb = require("../dbHandler/sqlDb");
const NidConnector = require("../../../../connectors/nid/nid.connector");

class BonusWalletLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.bonusWalletModel = this.models.BonusWalletModel;
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

	async uploadBamBonus(ctx) {
		try {
			const model = this.bonusWalletModel;
			const coreSql = this.coreSql;
			// const sql = this.sqlDB;
			const uploadedUsers = [];
			const workBookReader = new XlsxStreamReader();
			ctx.params.pipe(workBookReader);
			const  bonusWalletLogic = new BonusWalletLogic(this.mainProcess);

			return new Promise((res, rej) => {
				workBookReader.on("worksheet", function (workSheetReader) {
					if (workSheetReader.id > 1) {
						// we only want first sheet
						workSheetReader.skip();
						return;
					}
					// print worksheet name
					console.log(workSheetReader.name);
					workSheetReader.on("row", async function (row) {
						if (row.attributes.r == 1) {
							// do something with row 1 like save as column names
						} else {
							const rawData = row.values.map((rowVal) => rowVal);
							if (!_.isEmpty(rawData[2])&& !_.isEmpty(rawData[3]) &&
							 !_.isEmpty(rawData[5]) && !_.isEmpty(rawData[6])
							 && !_.isEmpty(rawData[7])&& !_.isEmpty(rawData[8])&& !_.isEmpty(rawData[9])) {
								 const dateParts = rawData[10].split("/");
								 const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
								 let bonus = rawData[9].replace(",", "");
								 bonus = bonus.replace(",", "");

								 const bamInfo = {
									 businessCode: rawData[2], effectiveDate: dateObject
									, customerName: rawData[3], phone: rawData[5], identityType: rawData[6]
									, identityNumber: rawData[7], propertyCode: rawData[8] , bonus: parseInt(bonus)
								};
								uploadedUsers.push(bamInfo);				
							}
						}
					});
					workSheetReader.on("end", async function () {
						console.log("uploadedUsers", uploadedUsers.length);
						for (let index = 0; index < uploadedUsers.length; index++) {
							const user = uploadedUsers[index];
							const customerId = await bonusWalletLogic.getCustomerId(user.phone, user.identityType, user.identityNumber);
							console.log("customerId", customerId);
							if (customerId) {
								user.customerId = customerId;
								const walletExisted = await coreSql.getWalletByCustomerId(user.customerId);
								let bonusWallet;
								if (walletExisted && !_.isEmpty(walletExisted)) {
								//Create transaction
									bonusWallet = walletExisted[0];
									const filter = {customerId: user.customerId, businessCode: user.businessCode, walletCode: bonusWallet.code, effectiveDate: user.effectiveDate};
									console.log("walletExisted", bonusWallet, filter);
									const duplicateWallet = await model.findOne(filter);
									if (duplicateWallet && !_.isEmpty(duplicateWallet)) {
										console.log("duplicateWallet ---> no need create transaction");
									} else {
										await  model.create(user, filter);
										console.log("create transaction");
										await coreSql.createTransaction(bonusWallet._id, user.businessCode, "BUDGET", user.bonus);
									}
								} else {
									console.log("chưa có ví thì tạo ví cho", user.customerName);
									// tạo ví
									const result = await coreSql.createWallet(user.customerId, user.customerName);
									if (result && result.recordset && result.output.result === 1) {
									// console.log("wallets", result.recordset);
										const wallets = result.recordset;
										if (wallets && wallets.length == 2) {
											//khi có wallet code thì lưu thông tin upload vào mongodb 
											user.walletCode = wallets[0].code;
											const filter = {customerId: user.customerId, businessCode: user.businessCode, walletCode: user.walletCode, effectiveDate: user.effectiveDate};
											await  model.create(user, filter);
											bonusWallet = wallets[0];
											await coreSql.createTransaction(bonusWallet._id, user.businessCode, "BUDGET", user.bonus);
										}
									}
								}
							}
							
							//Tạo transaction

						}
						res(ResponseHelper.resInfo(uploadedUsers.length + " bam bonus uploaded!"));
					});
					// call process after registering handlers
					workSheetReader.process();
				});
				workBookReader.on("end", function () {
					// res(ResponseHelper.resInfo(uploadedUsers.length + " bam bonus uploaded!"));
				});
			});

		} catch (error) {
			ResponseHelper.resErr(ResponseCode.SYS_STATUS_CODE.BAD_REQUEST, error.message, 400);
		}
	}
}

module.exports = BonusWalletLogic;
