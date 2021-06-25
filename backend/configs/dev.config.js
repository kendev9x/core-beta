const os = require("os");

const DevConfig = {
	namespace: "NOVA-BE-DEV",
	nodeID: (process.env.NODEID ? process.env.NODEID : "") + os.hostname().toLowerCase(),
	// Add manual -- not default
	versionEndpoint: "v3",
	defaultPathEndpoint: "/api/v3",
	defaultExposeIP: "0.0.0.0",
	rateLimit: {
		limit: 10000
	},
	// End
	metadata: {},
	logger: {
		type: "CONSOLE",
		options: {
			colors: false,
			moduleColors: false,
			formatter: "simple",
			objectPrinter: null,
			autoPadding: false
		}
	},
	logLevel: "info",
	transporter: "nats://127.0.0.1:4222",
	serializer: "ProtoBuf",
	requestTimeout: 0,
	retryPolicy: {
		enabled: true,
		retries: 5,
		delay: 100,
		maxDelay: 1000,
		factor: 2,
		check: err => err && !!err.retryable
	},
	maxCallLevel: 100,
	heartbeatInterval: 10,
	heartbeatTimeout: 30,
	contextParamsCloning: false,
	tracking: {
		enabled: true,
		shutdownTimeout: 5000,
	},
	disableBalancer: true,
	registry: {
		strategy: "RoundRobin",
		preferLocal: true
	},
	circuitBreaker: {
		enabled: false,
		threshold: 0.5,
		windowTime: 60,
		minRequestCount: 20,
		halfOpenTime: 10 * 1000,
		check: err => err && err.code >= 500
	},
	bulkhead: {
		enabled: false,
		concurrency: 10000,
		maxQueueSize: 10000,
	},
	validator: true,
	errorHandler: function (err, info) {
		this.logger.warn("Log the error:", err);
		throw err; // Throw further
	},
	// metrics: {
	// 	enabled: true,
	// 	reporter: {
	// 		type: "Prometheus",
	// 		options: {
	// 			port: process.env.GW_METRICS_PORT,
	// 			path: "/metrics",
	// 			defaultLabels: registry => ({
	// 				namespace: registry.broker.namespace,
	// 				nodeID: registry.broker.nodeID
	// 			})
	// 		}
	// 	}
	// },
	tracing: {
		enabled: true,
		exporter: {
			type: "Console",
			options: {
				logger: null,
				colors: true,
				width: 100,
				gaugeWidth: 40
			}
		}
	},
	internalServices: false,
	middlewares: [],
	// Register custom REPL commands.
	replCommands: null,
	transit: {
		maxQueueSize: 50 * 1000,
		disableReconnect: false,
		disableVersionCheck: false,
		packetLogFilter: ["HEARTBEAT"]
	},
	created(broker) {
		console.log("Broker created");
	},
	async started(broker) {
		console.log("Broker started");
	},
	async stopped(broker) {
		console.log("Broker stopped");
	},
};

module.exports = DevConfig;
