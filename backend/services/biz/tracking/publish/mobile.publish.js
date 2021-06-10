const {UserActivityLogic} = require("../logics");

/**
 Mobile Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class MobilePublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.userActivityLogic = new UserActivityLogic(mainProcess);
	}
}

module.exports = MobilePublish;
