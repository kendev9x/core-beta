const request = require("request-promise");

/**
 * Alert Connector: send notification to channels chat: MS-Teams, Telegram
 * @param: {mainProcess}: object {logger}
 */
class AlertConnector {
	constructor(mainProcess) {
		this.logger = mainProcess.logger;
	}

	/**
	 * Send error: send error notification to MS-Teams (private alert only use for dev monitor)
	 * @param: {errorObj} required: object Error
	 * @param: {alertConfig} optional: object configuration connector
	 */
	sendError(errorObj, reqObj = {}, alertConfig = {}) {
		/** TODO: IMPLEMENT SEND ERROR TO CHANNEL CHAT */
	}

	/**
	 * Send message: send message notification to channels chat: MS-Teams, Telegram from config setup at DB
	 * @param: {messageObj}: required Info {title, message}
	 * @param: {alertConfig}: require configuration connector
	 */
	sendMessage(messageObj, alertConfig) {
		return new Promise((res, rej) => {
			if (!messageObj || !messageObj.message) {
				this.logger.warning("sendMessage is missing message content");
				rej(new Error("sendMessage is missing message content"));
			}
			if (!alertConfig || !alertConfig.endpoint) {
				this.logger.warning("sendMessage is missing alertConfig or missing endpoint in config");
				rej(new Error("sendMessage is missing alertConfig or missing endpoint in config"));
			}
			const requestObj = {
				method: "POST",
				uri: alertConfig.endpoint,
				body: {
					text: `${messageObj.message}`
				},
				headers: {
					"Content-Type": "application/json",
				},
				json: true
			};
			request(requestObj)
				.then((result) => {
					this.logger.info(JSON.stringify(result));
					res(true);
				}).catch((err) => {
					this.logger.error(JSON.stringify(err));
					rej(err);
				});
		});
	}
}

module.exports = AlertConnector;

/** TESTING */
// const test = new AlertConnector({logger: {info: () => {}, error: () => {}}});
// test.sendMessage({title: "Implement", message: "I'm Batman"}, {
//   channelName: "NovaID OTP ALERT - DEV MONITOR",
//   endpoint: "https://api.telegram.org/bot1371184248:AAHow6ih9w2QZB9Z0WyWAe3OshWLn2dLOuY"
//     + "/sendMessage?chat_id=-410121127",
//   isUse: true
// });
