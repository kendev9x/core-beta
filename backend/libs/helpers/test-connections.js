// const io = require("socket.io-client");
// const socket = io.connect("http://localhost:8080");
//
// socket.on("connect", () => {
// 	console.log("Successfully connected!");
// 	socket.emit("call", "getAllIndustry", (res) => {
// 		console.log(res);
// 	});
// });

// const io = require("socket.io-client");
// const socket = io("http://localhost:8080",  { transports: ["polling"] });
// socket.on("connect", () => {
// 	socket.emit("call", "getAllIndustry", {},
// 		function(err, res) {
// 			if (err) {
// 				console.error(err);
// 			} else {
// 				console.log("call success:", res);
// 			}
// 		});
// });
// socket.on("connect_error", (err) => {
// 	console.log(err);
// 	throw err;
// });

const io = require("socket.io-client");
this.socket = io("http://localhost:8080");

this.socket.on("connect", () => {
	console.log("Successfully connected!");
	this.socket.emit("hello", "Chó con 12333444");
	console.log("Emitted event");
	this.socket.on("goodbye", (data) => {
		console.log(data);
	});
});

this.socket.on("connect_error", (err) => {
	console.log(err);
	throw err;
});
