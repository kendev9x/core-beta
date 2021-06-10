const {NovaHelpers} = require("../../../../libs");
const {Response} = require("../io");
const {BamLogic} = require("../logics");
// return await NovaHelpers.MongoFuncHelper.$save(this.model, ent);

/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.bamLogic = new BamLogic(mainProcess);
	}
}

module.exports = MobilePublish;
