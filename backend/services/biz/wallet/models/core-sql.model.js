
const SqlDriver = require("mssql");
const SqlDb = require("../dbHandler/sqlDb");

class CoreSQLModel {
	/** ApiKeyModel connection db created when service start
	 * @param dbConnection connection db created when service start
	 * @param plugins is array plugin use to add to schema
	 * @param logger
	 */
	constructor(plugins = [], logger = {}) {
		this.logger = logger;
		this.sqlDB = new SqlDb();
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
		} catch (e) {
			return null;
			// return ResponseHelper.resErr(506, "Process Failed", 507);
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
			console.log(error);
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
			console.log(error);
			return null;
		}
		
	}
}

module.exports = CoreSQLModel;
