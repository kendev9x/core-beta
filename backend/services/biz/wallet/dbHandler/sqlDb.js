const SqlDriver = require("mssql");

const _configConnection = {
	server: process.env.SQL_HOST_WALLET || "127.0.0.1",
	user: process.env.SQL_USER_WALLET || "novaID2021",
	password: process.env.SQL_PASSWORD_WALLET || "novaid@1234",
	database: process.env.SQL_DB_WALLET || "NID-WALLET",
	options: {
		port: process.env.SQL_PORT_WALLET || 1433,
		trustServerCertificate: true,
		instanceName: process.env.SQL_INSTANCE_WALLET === "NULL" ? null : process.env.SQL_INSTANCE_WALLET
	}
};

class SqlDb {
	constructor(systemConfig) {
		this.systemConfig = systemConfig;
		this.dbConfig = _configConnection;
		this.connection = null;
	}

	async createConnection() {
		const connection = await SqlDriver.connect(_configConnection);
		this.connection = connection;
		return connection;
	}

	closeConnection() {
		this.connection.close();
	}
}

module.exports = SqlDb;

