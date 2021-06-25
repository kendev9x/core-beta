const FilePublicRoute = require("./file/file-public.routes");
const FilePrivateRoute = require("./file/file-private.routes");
class MobileRoutes {
	constructor(config, broker) {
		this.config = config;
		this.filePublicRoute = new FilePublicRoute(config, broker);
		this.filePrivateRoute = new FilePrivateRoute(config, broker);
	}

	register() {
		return [
			this.filePublicRoute.registerRoute(),
			this.filePrivateRoute.registerRoute(),
		];
	}
}

module.exports = MobileRoutes;
