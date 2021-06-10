const {UserActivityLogic} = require("../logics");

/**
 Portal Publish: Processing logic industry for mobile app
 @param {mainProcess} props: logger...
 */
class PortalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.userActivityLogic = new UserActivityLogic(mainProcess);
	}
}

module.exports = PortalPublish;
