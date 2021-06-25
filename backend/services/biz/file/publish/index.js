const FilePublish = require("./file.publish");

module.exports = {
	/**
	 Init logics class
	 * @param mainProcess object. Props: logger...
	 */
	init(mainProcess) {
		return {
			file: new FilePublish(mainProcess),
		};
	}
};
