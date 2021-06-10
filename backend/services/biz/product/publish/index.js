const MobilePublish = require("./mobile.publish");
const PortalPublish = require("./portal.publish");

module.exports = {
	/**
	 Init logics class
	 * @param mainProcess object. Props: logger...
	 */
	init(mainProcess) {
		return {
			mobile: new MobilePublish(mainProcess),
			portal: new PortalPublish(mainProcess)
		};
	}
};
