const MobilePublish = require("./mobile.publish");
const PortalPublish = require("./portal.publish");
const InternalPublish = require("./internal.publish");

module.exports = {
	/**
	 Init logics class
	 * @param mainProcess object. Props: logger...
	 */
	init(mainProcess) {
		return {
			internal: new InternalPublish(mainProcess),
			mobile: new MobilePublish(mainProcess),
			portal: new PortalPublish(mainProcess)
		};
	}
};
