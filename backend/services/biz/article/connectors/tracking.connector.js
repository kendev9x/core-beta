const _ = require("lodash");

class TrackingConnector {
	constructor(mainProcess) {
		// this.logger = mainProcess.logger;
	}

	async logUserActivity(ctx, dataChanged = {}) {
		if (!ctx || _.isEmpty(ctx)) {
			return false;
		}
		return await ctx
			.call("v1.tracking.createAct", {
				body: {
					service: ctx.service.name,
					action: ctx.action.name,
					username: ctx.meta.userName,
					data: _.isEmpty(dataChanged)
						? ctx.params.body
						: dataChanged,
				},
			})
			.then((result) => {
				if (result) {
					return result.data;
				}
			});
	}
}

module.exports = TrackingConnector;
