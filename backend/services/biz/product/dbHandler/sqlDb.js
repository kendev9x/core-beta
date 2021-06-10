const SqlDriver = require("mssql");

const _configConnection = {
	server: "127.0.0.1",
	user: "novaID2021",
	password: "novaid@1234",
	database: "NID-TESTING",
	options: {
		port: 1433,
		trustServerCertificate: true,
		instanceName: "SQLEXPRESS"
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