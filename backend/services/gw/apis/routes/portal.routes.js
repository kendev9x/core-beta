const ProductRoute = require("./portal/product.portal.routes");
const AccountRoute = require("./portal/account.portal.routes");
const AuthPublicRoute = require("./portal/auth-public.portal.routes");
const WalletPortalRoutes = require("./portal/wallet.portal.routes");
const ArticlePortalRoutes = require("./portal/article.portal.routes");

class PortalRoutes {
	constructor(config, broker) {
		this.config = config;
		this.productRoute = new ProductRoute(config, broker);
		this.accountRoute = new AccountRoute(config, broker);
		this.authPublicRoute = new AuthPublicRoute(config, broker);
		this.walletRoute = new WalletPortalRoutes(config, broker);
		this.articlePortalRoutes = new ArticlePortalRoutes(config, broker);
	}

	register() {
		return [
			this.productRoute.registerRoute(),
			this.accountRoute.registerRoute(),
			this.authPublicRoute.registerRoute(),
			this.walletRoute.registerRoute(),
			this.articlePortalRoutes.registerRoute(),
		];
	}
}

module.exports = PortalRoutes;
