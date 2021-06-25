const _ = require("lodash");

const statusCodes = {};
statusCodes[exports.Success = "00"] = "Success";
statusCodes[exports.InvalidMobile = "01"] = "Invalid Mobile"; /* Sai số điện thoại */
statusCodes[exports.InvalidLength = "02"] = "Invalid Length"; /* Độ dài tin nhắn không hợp lệ */
statusCodes[exports.InvalidSender = "03"] = "Sai Sender"; /* Sai Sender */
statusCodes[exports.InvalidKeyword = "04"] = "Invalid Keyword"; /* Sai Keyword */
statusCodes[exports.InvalidUserNameOrPass = "06"] = "Invalid UserName/Pass"; /* Sai Username/Password */
statusCodes[exports.InvalidIPAddress = "07"] = "Invalid IP Address"; /* Địa chỉ IP không được phép truy cập */
statusCodes[exports.InvalidLocalTime = "08"] = "Invalid LocalTime"; /* Sai Localtime */
statusCodes[exports.DuplicateMessage = "10"] = "Duplicate Message"; /* Tin nhắn bị trùng lặp */
statusCodes[exports.InvalidContentType = "11"] = "Invalid ContentType"; /* Sai loại tin nhắn */
statusCodes[exports.InvalidChargingFlag = "12"] = "Invalid ChargingFlag"; /* Sai ChargingFlag */
statusCodes[exports.MobileDenied = "15"] = "Mobile Denied"; /* Số điện thoại bị từ chối gửi tin */
/* Sender không hỗ trợ gửi tin nhắn với nhà mạng này */
statusCodes[exports.InvalidSenderByTelco = "16"] = "Invalid Sender By Telco";
statusCodes[exports.Fail = "-1"] = "Fail"; /* Gửi tin không thành công */

exports.getStatusText = (statusCode) => {
  if (_.has(statusCodes, statusCode)) {
    return statusCodes[statusCode];
  }
  throw new Error(`Status code does not exist: ${statusCode}`);
};

exports.getStatusCode = (reasonPhrase) => Object.keys(statusCodes).forEach((key) => {
  if (_.isEqual(key, reasonPhrase)) {
    return parseInt(key, 10);
  }
  throw new Error(`Reason phrase does not exist: ${reasonPhrase}`);
});
