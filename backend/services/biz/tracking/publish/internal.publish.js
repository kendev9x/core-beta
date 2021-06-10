const {UserActivityLogic} = require("../logics");

/**
 Internal Publish: Publish all actions for internal micro services
 @param {mainProcess} props: logger...
 */

class InternalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.userActivityLogic = new UserActivityLogic(mainProcess);
	}

	/** Internal Publish: Create
	 * @param paramObj: userActivity param object
	 * @output Promise<T> {code, data, message}
	 */
	createAct(paramObj) {
		return this.userActivityLogic.createActivity(paramObj);
	}
}

module.exports = InternalPublish;
