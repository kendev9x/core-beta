const ProductRoute = require("./mobile/product.mobile.routes");
const AccountRoute = require("./mobile/account.mobile.routes");
const AuthPublicRoute = require("./mobile/auth-public.mobile.routes");

class MobileRoutes {
	constructor(config, broker) {
		this.config = config;
		this.productRoute = new ProductRoute(config, broker);
		this.accountRoute = new AccountRoute(config, broker);
		this.authPublicRoute = new AuthPublicRoute(config, broker);
	}

	register() {
		return [
			this.productRoute.registerRoute(),
			this.accountRoute.registerRoute(),
			this.authPublicRoute.registerRoute()
		];
	}
}

module.exports = MobileRoutes;
