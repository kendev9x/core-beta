const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { CoreHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");
const {ObjectId} = require("bson");
const { hashSync, compareSync } = require("bcryptjs");

class PortalTokenLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.portalTokenModel = this.models.PortalTokenModel;
	}

	async createPortalToken(data) {
		const portalToken = await this.portalTokenModel.create(data);
		return super.resInfo(portalToken);
	}

	async getPortalTokenV1ByTokenV2(tokenV2 = '') {
		const portalToken = await this.portalTokenModel.findOne({tokenV2});
		return super.resInfo(portalToken.tokenV1);
	}
}

module.exports = PortalTokenLogic;
