const lodash = require("lodash");
const redis = require("redis");
const AlertConnector = require("../alert/alert.connector");
const util = require('util');
class RedisConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.client = redis.createClient({
			host: process.env.REDIS_URL || "127.0.0.1",
			port: process.env.REDIS_PORT || 6379,
			// password: process.env.REDIS_PASSWORD || "redis$2021"
		});
		this.client.get = util.promisify(this.client.get);
	}
	setString(key, value, expiration){
		this.client.set(key, value, "EX", expiration, (err, reply) => {
			if (err) throw err;
			console.log(reply, " is stored in redis");
		});
	}
	async getString(key){
		return  await this.client.get(key);
	}

	setObject(key, object, expiration){
		this.client.hmset(key, object, (err, reply) => {
			if (err) throw err;
			console.log(reply, " is stored in redis");
		});
		this.client.expire(key, expiration);

	}

	getObject(id, key){
		return new Promise((res, rej) => {
			this.client.hmget(id, key, (err, res) => {
				res(res[0]);
			});
		});
	}
}

module.exports = RedisConnector;
// const redisClass= new RedisConnector(null);
// let getValue = async () => {
// 	const value = await redisClass.getObject("key2", ["a", "b"]);
// 	console.log(value);
// };
// getValue();
// redisClass.setString("key", "value123", 60);
 // redisClass.setObject("key22",{a:1, b:2, c:'xxx'}, 60);
