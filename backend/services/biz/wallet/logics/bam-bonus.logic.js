/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const {NovaHelpers} = require("../../../../libs");
const BaseLogic = require("./base.logic");
const XlsxStreamReader = require("xlsx-stream-reader");
const { ResponseHelper, RequestHelper} = require("../../../../libs/helpers");
const SqlDriver = require("mssql");
const SqlDb = require("../dbHandler/sqlDb");

class BamBonusLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.bamBonusModel = this.models.BamBonusModel;
		this.coreSql = this.models.CoreSQLModel;
		this.sqlDB = new SqlDb(mainProcess);
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

	
	/** Logic: Get all customer
	 * @output Promise<T> {code, data, message}
	 */
	getList() {
		return new Promise((res, rej) => {
			this.bamBonusModel.list()
				.then((result) => res(super.resInfo(result)))
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}

	async createBamBonusInfo(bamInfo) {
		if (!bamInfo) {
			return null;
		}
		return this.bamBonusModel.create(bamInfo);
	}

	async getLogs(filter) {
		return this.bamBonusModel.getAll(filter);
	}
	async uploadBamBonus(ctx) {
		try {
			const model = this.bamBonusModel;
			const coreSql = this.coreSql;
			// const sql = this.sqlDB;
			const uploadedUsers = [];
			const workBookReader = new XlsxStreamReader();
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
					workSheetReader.on("row",  function (row) {
						if (row.attributes.r == 1) {
							// do something with row 1 like save as column names
						} else {
							const rawData = row.values.map((rowVal) => rowVal);
							if (!_.isEmpty(rawData[1]) && !_.isEmpty(rawData[2])&& !_.isEmpty(rawData[3]) &&
							 !_.isEmpty(rawData[5]) && !_.isEmpty(rawData[6])
							 && !_.isEmpty(rawData[7])&& !_.isEmpty(rawData[8])&& !_.isEmpty(rawData[9])) {
								 const dateParts = rawData[10].split("/");
								 const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
								 let bonus = rawData[9].replace(",", "");
								 bonus = bonus.replace(",", "");
								 const bamInfo = {
									idNova: rawData[1], businessCode: rawData[2]
									, customerName: rawData[3], phone: rawData[5], idType: rawData[6]
									, taxCode: rawData[7], propertyCode: rawData[8] , bonus: parseInt(bonus)
									, effectiveDate: dateObject
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
							const walletExisted = await coreSql.getWalletByCustomerId(user.idNova);
							let bonusWallet;
							if (walletExisted && !_.isEmpty(walletExisted)) {
								//Create transaction
								bonusWallet = walletExisted[0];
								console.log("walletExisted", bonusWallet);
								const filter = {idNova: user.idNova, businessCode: user.businessCode, walletCode: bonusWallet.code, effectiveDate: user.effectiveDate};
								const duplicateWallet = await model.findOne(filter);
								if (duplicateWallet && !_.isEmpty(duplicateWallet)) {
									console.log("duplicateWallet ---> no need create transaction");
								} else {
									console.log("create transaction");
									await coreSql.createTransaction(bonusWallet._id, user.businessCode, "BUDGET", user.bonus);
								}
					
							} else {
								console.log("chưa có ví thì tạo ví cho", user.customerName);
								// tạo ví
								const result = await coreSql.createWallet(user.idNova, user.customerName)
								if (result && result.recordset && result.output.result === 1) {
									// console.log("wallets", result.recordset);
									const wallets = result.recordset;
									if (wallets && wallets.length == 2) {
									//khi có wallet code thì lưu thông tin upload vào mongodb 
										user.walletCode = wallets[0].code;
										const filter = {idNova: user.idNova, businessCode: user.businessCode, walletCode: user.walletCode, effectiveDate: user.effectiveDate};
										await  model.create(user, filter);
										bonusWallet = wallets[0];
										await coreSql.createTransaction(bonusWallet._id, user.businessCode, "BUDGET", user.bonus);

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

module.exports = BamBonusLogic;
