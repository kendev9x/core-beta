const {NovaHelpers} = require("../../../../libs");
const {CustomerLogic} = require("../logics");
const {Response} = require("../io");

/**
 Internal Publish: Publish all actions for internal micro services
 @param {mainProcess} props: logger...
 */

class InternalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.customerLogic = new CustomerLogic(mainProcess);
	}
}

module.exports = InternalPublish;
