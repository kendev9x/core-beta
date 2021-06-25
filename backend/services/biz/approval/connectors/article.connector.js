const _ = require("lodash");
const { RequestHelper, FunctionHelper } = require("../../../../libs/helpers");

class ArticleConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.logger = mainProcess.logger;
	}

	async setArticleIsActive(ctx, itemId, isActive = true) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		const functionPath = RequestHelper
			.genPathByServiceAndActionName(this.mainProcess.config,
				process.env.BIZ_ARTICLE_NAME, "internalSetIsActive");
		return await ctx.call(functionPath,
			{
				body: {
					_id: itemId,
					isActive
				}
			}).then((result) => {
			if (result) {
				return result.data;
			}
		});
	}
}

module.exports = ArticleConnector;
