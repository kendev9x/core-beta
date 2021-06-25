const { NovaHelpers } = require("../../../../libs");
const { ArticleLogic } = require("../logics");
const { Response } = require("../io");

class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.articleLogic = new ArticleLogic(mainProcess);
	}
}

module.exports = MobilePublish;
