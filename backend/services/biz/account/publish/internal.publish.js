const {NovaHelpers} = require("../../../../libs");
const {CustomerLogic, UserLogic} = require("../logics");
const {Response} = require("../io");

/**
 Internal Publish: Publish all actions for internal micro services
 @param {mainProcess} props: logger...
 */

class InternalPublish {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.customerLogic = new CustomerLogic(mainProcess);
		this.userLogic = new UserLogic(mainProcess);
	}

	findUserByUserAndPass(ctx) {
		const {userName, password} = ctx.params.body;
		return this.userLogic.findUserByUserAndPass({userName, password})
			.then((result) => {
				const {data} = result;
				if (!data) {
					return result;
				}
				result.data = NovaHelpers.MapperHelper.mapListObj(data, {userName: "", fullName: ""});
				return result;
			})
			.catch((err) => err);
	}

	getActionsByUserId(ctx) {
		const {accountId} = ctx.params.body;
		return this.userLogic.getActionsByUserId(accountId)
			.then((result) => {
				const {data} = result;
				if (!data) {
					return result;
				}
				result.data;
				return result;
			})
			.catch((err) => err);
	}

	findProfileByPhone(ctx) {
		const {phone} = ctx.params.body;
		return this.customerLogic.findProfileByPhone(phone)
			.then((result) => {
				const {data} = result;
				if (!data) {
					return result;
				}
				result.data;
				return result;
			})
			.catch((err) => err);
	}
}

module.exports = InternalPublish;
