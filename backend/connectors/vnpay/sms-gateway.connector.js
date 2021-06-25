const soap = require("soap");
const path = require("path");
const Axios = require("axios");
const request = require("request-promise");

const setting = require("./configs/sms.config");
const settingProd = require("./configs/prod-sms.config");
const testSettingNewAPI = require("./configs/sms-new-api.config");
const settingNewAPI = require("./configs/sms-new-api.config");

const wsdlPath = path.join(__dirname, "schemas", "vnpay-sms-gateway-wsdl.xml");
const wsdlPathProd = path.join(__dirname, "schemas", "prod-vnpay-sms-gateway-wsdl.xml");

class SmsGateway {
	constructor(logger) {
		if (process.env.NAME_EVN && process.env.NAME_EVN === "PROD") {
			this.setting = settingProd;
		} else {
			this.setting = setting;
		}
		this.logger = logger;
	}

	/**
   * Gửi tin nhắn CSKH hoặc tin nhắn phản hồi sang hệ thống VNPAY
   * MT: Mobile Terminated of the VNPAY System
   * data: {
   *   {String} destination Số điện thoại: 84xxxx
       {String} sender Tên BrandName: Với MT chủ động, ví dụ VNPAY. ServiceID: với tin nhắn phản hồi, ví dụ 8149
       {String} keywordName Từ khóa dịch vụ
       {String} outContent Nội dung tin nhắn (text - không dấu)
       {String} chargingFlag 0 với MT chủ động, 1 với MT phản hồi
       {String} moSeqNo 0 với MT chủ động, >0 với MT phản hồi:
       là số MoID VNPAY truyền sang khi gọi vào WS nhận MO của Ngân hàng
       {String} contentType Loại tin nhắn, SMS (Tin nhắn CSKH)
       {String} localTime Format yyyyMMddhhmmssfff: Thời gian của hệ thống Ngân hàng
       {String} username Username (vnpay cung cấp khi kết nối)
       {String} password Mật khẩu (vnpay cung cấp khi kết nối)
   * }
   * @param data
   */
	async send(data) {
		let connectVNPayMT;

		if (process.env.NAME_EVN && process.env.NAME_EVN === "PROD") {
			connectVNPayMT = await soap.createClientAsync(wsdlPathProd);
		} else {
			connectVNPayMT = await soap.createClientAsync(wsdlPath);
		}
		const sendDataToVnPayMT = await connectVNPayMT.sendMTAsync(data);
		if (!sendDataToVnPayMT) {
			throw new Error("Can not send message to MT");
		}

		this.logger.info(`Status of send to VNPAYMT ${sendDataToVnPayMT}`);

		const code = sendDataToVnPayMT[0].return.split("|")[0];

		return {
			code,
			payload: sendDataToVnPayMT,
		};
		// return soap.createClientAsync(wsdlPath).then((client) => client.sendMTAsync(data).then((result) => {
		//   this.logger.info(result);
		//   const code = result[0].return.split("|")[0];
		//   return {code, payload: result };
		// }));
	}

	/**
   *
   * @param body
   * @returns {Promise<{code: number, message: string}|AxiosResponse<T>>}
   */
	async sendSMSNewAPI(body) {
		try {
			const {
				url, sender, keyword, partnerCode, sercretKey
			} = (process.env.NAME_EVN && process.env.NAME_EVN === "PROD") ? settingNewAPI : testSettingNewAPI;
			const data = {
				messageId: body.id,
				destination: body.destination,
				sender,
				keyword,
				shortMessage: body.outContent,
				encryptMessage: "",
				isEncrypt: 0,
				type: 1,
				partnerCode,
				sercretKey
			};
			return await Axios.post(url, data);
		} catch (e) {
			this.logger.error(e.toString());
			return {
				code: 500,
				message: "Internal error"
			};
		}
	}
}

module.exports = SmsGateway;
