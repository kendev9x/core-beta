
const SqlDriver = require("mssql");
const SqlDb = require("../dbHandler/sqlDb");
class CoreSQLModel {
	constructor(plugins = [], logger = {}) {
		this.logger = logger;
		this.sqlDB = new SqlDb();
	}

	async getTransactionByCustomerId(customerId){
		try {
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("customerId", SqlDriver.NVarChar(25), customerId)
				.execute("TRANS_GET_LIST_BY_CUSTOMER");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return result.recordset;
			}
			return result;
		} catch (err) {
			this.logger.error(JSON.stringify(err));
			return null;
		}
	}
	async getTransactionByWalletId(walletId){
		try {
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("walletId", SqlDriver.NVarChar(25), walletId)
				.execute("TRANS_GET_LIST_BY_WALLET");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return result.recordset;
			}
			return result;
		} catch (err) {
			this.logger.error(JSON.stringify(err));
			return null;
		}
	}
	async getWalletByCustomerId(customerId) {
		try {
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("customerId", SqlDriver.NVarChar(25), customerId)
				.execute("WALLET_GET_LIST_BY_CUSTOMER");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return result.recordset;
			}
			return result;
		} catch (err) {
			this.logger.error(JSON.stringify(err));
			return null;
		}
	}

	async getListWallet(code, customerId, skip, take){
		try {
			const dbConnection = await this.sqlDB.createConnection();
			if (code === undefined) code = null;
			if (customerId === undefined) customerId = null;
			if (skip === undefined) skip = 0;
			if (take === undefined) take = 10;
			const result = await dbConnection.request()
				.input("code", SqlDriver.NVarChar(25), code)
				.input("customerId", SqlDriver.NVarChar(25), customerId)
				.input("skip", SqlDriver.Int, skip)
				.input("take", SqlDriver.Int, take)
				.execute("WALLET_GET_LIST");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return result.recordset;
			}
			return result;
		} catch (err) {
			this.logger.error(JSON.stringify(err));
			return null;
		}
	}
	async getWalletById(walletId, customerId) {
		try {
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("id", SqlDriver.BigInt, walletId)
				.input("customerId", SqlDriver.NVarChar(25), customerId)
				.execute("WALLET_GET_BY_ID");
			this.sqlDB.closeConnection();
			if (result.recordset) {
				return result.recordset;
			}
			return result;
		} catch (err) {
			this.logger.error(JSON.stringify(err));
			return null;
		}
	}

	async createTransaction(walletId, businessCode, transactionType, amount){
		try {
			console.log("createTransaction", walletId, businessCode, transactionType, amount);
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("walletId", SqlDriver.BigInt, walletId)
				.input("businessCode", SqlDriver.NVarChar(50), businessCode)
				.input("transTypeCode", SqlDriver.NVarChar(50), transactionType)
				.input("amount", SqlDriver.BigInt, amount)
				.output("result", SqlDriver.Int)
				.output("message", SqlDriver.NVarChar(100))
				.execute("TRANS_CREATE");
			console.log("result createTransaction", result.output);
			this.sqlDB.closeConnection();
			return result.output;
		} catch (error) {
			this.logger.error(JSON.stringify(error));
			return null;
		}
	}

	async createWallet(customerId, customerName){
		try {
			const dbConnection = await this.sqlDB.createConnection();
			const result = await dbConnection.request()
				.input("customerId", SqlDriver.NVarChar(24), customerId)
				.input("customerName", SqlDriver.NVarChar(250), customerName)
				.output("result", SqlDriver.Int)
				.output("message", SqlDriver.NVarChar(100))
				.execute("WALLET_CREATE");
			this.sqlDB.closeConnection();
			return result;
		} catch (error) {
			this.logger.error(JSON.stringify(error));
			return null;
		}

	}
}

module.exports = CoreSQLModel;
