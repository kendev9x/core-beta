const ProductRoute = require("./mobile/product.mobile.routes");
const AccountRoute = require("./mobile/account.mobile.routes");
const AuthPublicRoute = require("./mobile/auth-public.mobile.routes");
const WalletMobileRoute = require("./mobile/wallet.mobile.routes");
const AuthRoute = require("./mobile/auth.mobile.routes");
const ArticleRoute = require("./mobile/article.mobile.routes");
class MobileRoutes {
	constructor(config, broker) {
		this.config = config;
		this.productRoute = new ProductRoute(config, broker);
		this.accountRoute = new AccountRoute(config, broker);
		this.authRoute = new AuthRoute(config, broker);
		this.authPublicRoute = new AuthPublicRoute(config, broker);
		this.walletMobileRoute = new WalletMobileRoute(config, broker);
		this.articleRoute = new ArticleRoute(config, broker);
	}

	register() {
		return [
			this.productRoute.registerRoute(),
			this.accountRoute.registerRoute(),
			this.authPublicRoute.registerRoute(),
			this.walletMobileRoute.registerRoute(),
			this.authRoute.registerRoute(),
			this.articleRoute.registerRoute(),
		];
	}
}

module.exports = MobileRoutes;
