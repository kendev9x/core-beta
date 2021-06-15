const {NovaHelpers} = require("../../../../libs");
const uuid = require("uuid");

// const decodeApikey = NovaHelpers.EncryptHelper.decryptBase64(ctx.meta.headers["apiKey"]);
const apiKey = {
	// eslint-disable-next-line indent
	"publicKey": "0b9ca335",
	"appName" : "nova-id",
	"appVersion" : "1.1.0",
	"uuid" : "jkshdfoso19231kjsdfosidfj",
	"osVersion" : 6.0,
	"os" : "android"
};
//client
const encodeApiKey = NovaHelpers.EncryptHelper.encryptBase64Object(apiKey);
console.log(encodeApiKey);
//eyJwdWJsaWNLZXkiOiIwYjljYTMzNSIsImFwcE5hbWUiOiJub3ZhLWlkIiwiYXBwVmVyc2lvbiI6IjEuMS4wIiwidXVpZCI6Imprc2hkZm9zbzE5MjMxa2pzZGZvc2lkZmoiLCJvc1ZlcnNpb24iOjYsIm9zIjoiYW5kcm9pZCJ9
//backend
const decodeApiKey = NovaHelpers.EncryptHelper.decryptBase64Object(encodeApiKey);
console.log(decodeApiKey);
const postFix = uuid.v4().toString();
console.log(postFix);
const apiKey2 = decodeApiKey.publicKey + "." + postFix;
console.log("apiKey", apiKey2);

const encodeApiKey2 = NovaHelpers.EncryptHelper.encryptBase64Object(apiKey);			

console.log("encodeApiKey2", encodeApiKey2);