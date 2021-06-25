const { ArticleLogic } = require("../logics");

/**
 Portal Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger, configs, dbMain, models
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.articleLogic = new ArticleLogic(mainProcess);
	}
	createArticles(ctx) {
		return this.articleLogic.createArticles(ctx);
	}
	updateArticles(ctx) {
		return this.articleLogic.updateArticles(ctx);
	}
	findArticles(ctx) {
		return this.articleLogic.findArticles(ctx);
	}
	findArticlesByIds(ctx) {
		return this.articleLogic.findArticlesByIds(ctx);
	}
	findArticlesByTags(ctx) {
		return this.articleLogic.findArticlesByTags(ctx);
	}
	getArticles(ctx) {
		return this.articleLogic.getArticles(ctx);
	}
	getAllArticles(ctx) {
		return this.articleLogic.getAllArticles(ctx);
	}
	getArticlesById(ctx) {
		return this.articleLogic.getArticlesById(ctx);
	}
	removeArticles(ctx) {
		return this.articleLogic.removeArticles(ctx);
	}
}

module.exports = PortalPublish;
