const ResCode = require("../../../../defined/response-code");
const { ApprovalConnector, TrackingConnector } = require("../connectors");
const BaseLogic = require("./base.logic");
const { RequestHelper, ResponseHelper } = require("../../../../libs/helpers");

class ArticleLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.articleModel = this.models.ArticleModel;
		this.approvalConnector = new ApprovalConnector();
		this.trackingConnector = new TrackingConnector();
	}

	async createArticle(context) {
		const params = RequestHelper.getParamsByMethodType(context);
		if (params === null || params === undefined) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.MISSING_PARAM
			);
		}
		const result = await this.articleModel.createArticle(params);
		if (result) {
			return ResponseHelper.resInfo(result);
		}
		return ResponseHelper.resFailed(
			ResCode.BIZ_STATUS_CODE.CMS.INTERNAL_ERROR
		);
	}

	async updateArticle(context) {
		const { id, body } = RequestHelper.getParamsByMethodType(context);
		if (id || body) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.MISSING_PARAM
			);
		}

		let article = await this.articleModel.findArticleById(id);
		if (!article) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}

		body.updateAt = new Date();
		const updateValue = { $set: body };
		const res = await this.articleModel.updateArticle(id, updateValue);
		if (res) {
			article = await this.articleModel.findArticleById(res._id);
			return ResponseHelper.resInfo(article);
		}
		return ResponseHelper.resFailed(
			ResCode.BIZ_STATUS_CODE.CMS.INTERNAL_ERROR
		);
	}

	async findArticle(context) {
		const { body } = RequestHelper.getParamsByMethodType(context);

		let pageSize = 10;
		let pageNumber = 1;

		if (body.pageNumber) {
			pageNumber = body.pageNumber;
			delete body.pageNumber;
		}
		if (body.pageSize) {
			pageSize = body.pageSize;
			delete body.pageSize;
		}
		body.isDelete = false;

		const pages = await this.articleModel.findArticle(
			body,
			pageNumber,
			pageSize
		);
		if (!pages) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		return ResponseHelper.resInfo(pages);
	}

	async getArticle() {
		const query = {
			isDelete: false,
			isActive: true,
		};
		const pages = await this.articleModel.findArticleByQuery(query);
		if (!pages) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		return ResponseHelper.resInfo(pages);
	}

	async getAllArticle(context) {
		const { body } = RequestHelper.getParamsByMethodType(context);
		const valueReturn = await this.articleModel.findAllAndSort(body);
		if (!valueReturn) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		return ResponseHelper.resInfo(valueReturn);
	}

	async getArticleById(context) {
		const { id } = RequestHelper.getParamsByMethodType(context);
		const pages = await this.articleModel.findArticleById(id);
		/** Find approval request for this project then set to return data */
		const approvalItem = await this.approvalConnector.getApprovalByItemId(
			context,
			id
		);
		if (!pages) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		if (approvalItem && approvalItem._id) {
			pages._doc.approval = approvalItem;
		}
		return ResponseHelper.resInfo(pages);
	}

	async removeArticle(context) {
		const { id } = RequestHelper.getParamsByMethodType(context);
		const pages = await this.articleModel.findArticleById(id);
		if (!pages) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		pages.isDelete = true;
		const updateValue = { $set: pages };
		const res = await this.articleModel.updateArticle(id, updateValue);
		if (res) {
			return ResponseHelper.resInfo(res);
		}
		return ResponseHelper.resFailed(
			ResCode.BIZ_STATUS_CODE.CMS.INTERNAL_ERROR
		);
	}

	async findArticleByIds(context) {
		const { body } = RequestHelper.getParamsByMethodType(context);
		const listIds = body.ids;
		const pages = await this.articleModel.findArticleByIds(listIds);
		if (!pages) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		return ResponseHelper.resInfo(pages);
	}

	async findArticleByTags(context) {
		const { body } = RequestHelper.getParamsByMethodType(context);
		const { tags } = body;
		const query = { tags: { $regex: new RegExp(`.*${tags}.*`, "i") } };
		const Article = await this.articleModel.findArticleByQuery(query);
		if (!Article) {
			return ResponseHelper.resFailed(
				ResCode.BIZ_STATUS_CODE.CMS.NOT_FOUND
			);
		}
		return ResponseHelper.resInfo(Article);
	}
}

module.exports = ArticleLogic;
