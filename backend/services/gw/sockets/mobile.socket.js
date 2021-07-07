// const server = require("http").Server();
// const io = require("socket.io")(server);
// const port = 8080;
//
// server.listen(port, () => {
// 	console.log(`Listening on ${port}`);
// });
//
// io.on("connection", (socket) => {
// 	// add handlers for socket events
// 	console.log(socket.id);
// 	socket.emit("plus", "ken");
// 	console.log(socket.id);
// 	socket.emit("industry-getAll", {abc: 123});
// });

const express = require("express");
const mapKeys = require("lodash/mapKeys");
module.exports = {
	name: "MobileIO",
	settings: {
		port: 8080
	},
	namespaces: {
		"/": {
			hello(ctx) {
				this.logger.info("Hello there");
				ctx.socket.emit("Well come to socket io!");
				return "Get this data!";
			}
		},
	},
	methods: {
		async createNamespace(io, key, values) {
			this.logger.info(`### ${key} is creating`);
			const svc = this;
			const socket_namespace = io.of(key);
			let event_connection = { name: "connection", value: (ctx) => { console.log("default connection"); return true; } };
			let event_disconnect = { name: "disconnect", value: (ctx) => { console.log("default disconnect"); return true; } };
			let events = [];
			//	Parse all namespaces schema and pre-fetch values
			mapKeys(values, (eventValue, eventKey) => {
				switch(eventKey) {
					case "connection":
						event_connection = { name: "connection", value: eventValue };
						break;
					case "disconnect":
						event_disconnect = { name: "disconnect", value: eventValue };
						break;
					default:
						events.push({ name: eventKey, value: eventValue });
						break;
				}
			});
			socket_namespace.on("connection", (client_socket) => {
				this.logger.info(`### ${key} - event - connection`);

				this.hash_events[`${key}.${event_connection.name}`](client_socket);
				client_socket.on("disconnect", this.hash_events[`${key}.${event_disconnect.name}`]);

				events.map((event) => {
					client_socket.on(event.name, this.hash_events[`${key}.${event.name}`].bind(this, client_socket));
				});

			});
			this.logger.info(`### ${key} is created`);
		},
		async createService(io) {
			this.logger.info(`### Start create socket-io service ${this.name}`);
			if (!this.namespaces) {
				return new Error("There is no 'namespaces'");
			}
			const array_promise_namespaces = [];
			let mapNamespaces = (namespaceValues, namespaceKey) => {
				this.logger.info(`### Namespace ${namespaceKey} start creation`);
				array_promise_namespaces.push(
					this.createNamespace.bind(this, io, namespaceKey, namespaceValues).call()
				);
			};
			mapKeys(this.namespaces, mapNamespaces);
			return Promise.all(array_promise_namespaces);
		},
	},
	created() {
		this.app = express();
		this.server = require("http").createServer(this.app);
		this.io = require("socket.io")(this.server, this.settings.options || {});
		this.io.on("connect", (socket) => {
			console.log("Connected id: " + socket.id);
			/** Listen on event Hello */
			socket.on("hello", (params) => {
				console.log("Hello, " + params);
			});
			socket.emit("goodbye", "111");
		});

	},
	started() {
		return Promise.all(
			[
				this.createService.bind(this, this.io).call()
			]
		).then(() => {
			this.server.on("error", (e) => {
				console.log("ERROR ERROR", e);
			});
			this.server.listen(
				this.settings.port,
				() => {
					console.log(`listening on *:${this.settings.port}`);
				}
			);
		}).catch((error) => {
			this.logger.error(error);
			return error;
		});
	},
	stopped() {
		console.log("socket-service stopped!");
	}
};
