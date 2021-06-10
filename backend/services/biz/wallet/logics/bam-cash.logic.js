/* eslint-disable no-mixed-spaces-and-tabs */
const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const {NovaHelpers} = require("../../../../libs");
const BaseLogic = require("./base.logic");
const XlsxStreamReader = require("xlsx-stream-reader");
const { ResponseHelper } = require("../../../../libs/helpers");
const SqlDriver = require("mssql");
const SqlDb = require("../dbHandler/sqlDb");
class BamLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.bamCashModel = this.models.BamCashModel;
		this.coreSql = this.models.CoreSQLModel;
		this.sqlDB = new SqlDb(mainProcess);
	}

	/** Logic: Get all customer
	 * @output Promise<T> {code, data, message}
	 */
	getList() {
		return new Promise((res, rej) => {
			this.bamCashModel.list()
				.then((result) => res(super.resInfo(result)))
				.catch((err) => rej(super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err)));
		});
	}

	async createBamInfo(bamInfo) {
		if (!bamInfo) {
			return null;
		}
		return this.bamCashModel.create(bamInfo);
	}

	async getLogs(filter) {
		return this.bamCashModel.getAll(filter);
	}

	async uploadBamCashs(ctx) {
		try {
			const model = this.bamCashModel;
			const coreSql = this.coreSql;

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

					// if we do not listen for rows we will only get end event
					// and have infor about the sheet like row count
					workSheetReader.on("row",  function (row) {
						if (row.attributes.r == 1) {
							// do something with row 1 like save as column names
						} else {
							const rawData = row.values.map((rowVal) => rowVal);
							if (!_.isEmpty(rawData[1]) && !_.isEmpty(rawData[2])&& !_.isEmpty(rawData[3]) &&
							 !_.isEmpty(rawData[4]) && !_.isEmpty(rawData[5]) && !_.isEmpty(rawData[6])
							 && !_.isEmpty(rawData[7])&& !_.isEmpty(rawData[8])&& !_.isEmpty(rawData[9])
							 && !_.isEmpty(rawData[11])&& !_.isEmpty(rawData[12])&& !_.isEmpty(rawData[13])
							 && !_.isEmpty(rawData[14])&& !_.isEmpty(rawData[15])&& !_.isEmpty(rawData[16])&& !_.isEmpty(rawData[17])) {
								 const dateParts = rawData[17].split("/");
								 const dateObject = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
								 let limit = rawData[15].replace(",", "");
								 limit = limit.replace(",", "");
								 const bamInfo = {
									idNova: rawData[1], businessCode: rawData[2], walletCode: rawData[3]
									, customerId: rawData[4], customerName: rawData[5], gender: rawData[6]
									, phone: rawData[7], idType: rawData[8], taxCode: rawData[9]
									, company: rawData[10], workPlace: rawData[11], position: rawData[12]
									, email: rawData[13], level: rawData[14], quarterLimit: parseInt(limit)
									, supervisor: rawData[16], effectiveDate: dateObject
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
								bonusWallet = walletExisted[1];
								console.log("walletExisted", bonusWallet);
								const filter = {idNova: user.idNova, businessCode: user.businessCode, walletCode: bonusWallet.code, effectiveDate: user.effectiveDate};
								const duplicateWallet = await model.findOne(filter);
								if (duplicateWallet && !_.isEmpty(duplicateWallet)) {
									console.log("duplicateWallet ---> no need create transaction");
								} else {
									console.log("create transaction");
									await coreSql.createTransaction(bonusWallet._id, user.businessCode, "BUDGET", user.quarterLimit);
								}
					
							} else {
								console.log("chưa có ví thì tạo ví cho", user.customerName);
								// tạo ví
								const result = await coreSql.createWallet(user.idNova, user.customerName)
								if (result && result.recordset && result.output.result === 1) {
									console.log("wallets", result.recordset);
									const wallets = result.recordset;
									if (wallets && wallets.length == 2) {
									//khi có wallet code thì lưu thông tin upload vào mongodb 
										user.walletCode = wallets[1].code;
										const filter = {idNova: user.idNova, businessCode: user.businessCode, walletCode: user.walletCode, effectiveDate: user.effectiveDate};
										await  model.create(user, filter);
										bonusWallet = wallets[1];
										await coreSql.createTransaction(bonusWallet._id, user.businessCode, "BUDGET", user.quarterLimit);

									}
								}
							}
							//Tạo transaction

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

module.exports = BamLogic;
