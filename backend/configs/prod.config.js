const os = require("os");
const { Middlewares } = require("moleculer");

const ProdConfig = {
	namespace: "NOVA-BE-PROD",
	nodeID: (process.env.NODEID ? process.env.NODEID + "-" : "") + os.hostname().toLowerCase(),
	// Add manual -- not default
	versionEndpoint: "v1",
	defaultPathEndpoint: "/api/v1",
	defaultExposeIP: "0.0.0.0",
	// End
	metadata: {},
	logger: {
		type: "Console",
		options: {
			colors: true,
			moduleColors: false,
			formatter: "simple",
			objectPrinter: null,
			autoPadding: false
		}
	},
	logLevel: "info",
	transporter: "NATS",
	serializer: "ProtoBuf",
	requestTimeout: 10 * 1000,
	retryPolicy: {
		enabled: false,
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
		enabled: false,
		shutdownTimeout: 5000,
	},
	disableBalancer: false,
	registry: {
		strategy: "RoundRobin",
		preferLocal: true
	},
	circuitBreaker: {
		enabled: false,
		threshold: 0.5,
		minRequestCount: 20,
		windowTime: 60,
		halfOpenTime: 10 * 1000,
		check: err => err && err.code >= 500
	},
	bulkhead: {
		enabled: false,
		concurrency: 10,
		maxQueueSize: 100,
	},
	validator: true,
	errorHandler: null,
	metrics: {
		enabled: true,
		reporter: {
			type: "Prometheus",
			options: {
				port: 4030,
				path: "/metrics",
				defaultLabels: registry => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID
				})
			}
		}
	},
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
	middlewares: [],
	// Register custom REPL commands.
	replCommands: null,
	// Called after broker created.
	created(broker) {
		console.log("Broker created");
	},
	// Called after broker started.
	async started(broker) {
		console.log("Broker started");
	},
	// Called after broker stopped.
	async stopped(broker) {
		console.log("Broker stopped");
	},

	/** Custom More Config */
	_MONGO_URI_PRODUCT_SERVICE: "mongodb://novaAdmin:123456789@10.16.21.1:27017/nvlp-dev?authSource=admin",
	_MONGO_URI_TRACKING_SERVICE: "mongodb://novaAdmin:123456789@10.16.21.1:27017/nvlp-dev-tracking?authSource=admin"
};

module.exports = ProdConfig;