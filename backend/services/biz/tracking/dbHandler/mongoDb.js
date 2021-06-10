const _ = require("lodash");
const mongoose = require("mongoose");

class MongoDb {
	constructor(systemConfig) {
		this.systemConfig = systemConfig;
	}
	createConnection(cb) {
		return mongoose.createConnection(
			this.systemConfig.MONGO_URI,
			{
				useNewUrlParser: true,
				useUnifiedTopology: true
			},
			(err, connection) => {
				if (err) {
					console.log(err);
					/** TODO Send alert */
				}
				if (cb && _.isFunction(cb)) {
					cb(err, connection);
				}
			}
		);
	}
}


module.exports = MongoDb;