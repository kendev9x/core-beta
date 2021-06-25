const _ = require("lodash");
const { FunctionHelper } = require("../../../../../libs/helpers");
const BaseTransfer = require("./base.transfer");

class ProductTemplateTransfer extends BaseTransfer {
	constructor(languageCode) {
		super(languageCode);
	}

	mappingList(listEnt) {
		return listEnt.map((ent) => this.mappingObj(ent));
	}

	mappingListBasic(listEnt) {
		return listEnt.map((ent) => this.mappingBasic(ent));
	}

	mappingBasic(ent) {
		if (!ent) {
			return ent;
		}
		return {
			_id: ent._id,
			name: ent.name,
			industry: ent.industry,
			industryName: ent.industryObj && ent.industryObj.name ? ent.industryObj.name : "",
			shortDesc: ent.shortDesc,
			description: ent.description,
			isActive: ent.isActive,
			createDate: ent.createDate,
			createdAt: ent.createdAt,
			createBy: ent.createBy,
			updateDate: ent.updateDate,
			updatedAt: ent.updatedAt,
			updateBy: ent.updateBy
		};
	}

	mappingObj(ent) {
		if (!ent) {
			return {};
		}
		delete ent.searchInfo;
		delete ent.createAt;
		delete ent.updateAt;
		return {
			_id: ent._id,
			name: super.translateContent(ent.name),
			isActive: ent.isActive,
			isDelete: ent.isDelete,
			shortDesc: ent.shortDesc,
			description: ent.description,
			industry: ent.industry,
			industryName: ent.industryObj ? super.translateContent(ent.industryObj.name) : "",
			revisions: ent.revisions
				? ent.revisions.map((revision) => ({
					_id: revision._id,
					isDelete: revision.isDelete,
					fields: revision.fields.map((field) => {
						field.label = super.translateContent(field.label);
						return field;
					})
				})) : [],
			createDate: ent.createDate,
			createdAt: ent.createdAt,
			createBy: ent.createBy,
			updateDate: ent.updateDate,
			updatedAt: ent.updatedAt,
			updateBy: ent.updateBy
		};
	}

	mappingCustom(ent) {
		if (!ent) {
			return {};
		}
		delete ent.searchInfo;
		delete ent.createAt;
		delete ent.updateAt;
		return {
			_id: ent._id,
			name: ent.name,
			isActive: ent.isActive,
			industry: ent.industry,
			industryName: ent.industryObj ? super.translateContent(ent.industryObj.name) : "",
			shortDesc: ent.shortDesc,
			description: ent.description,
			revId: ent.revisions.find((revision) => !revision.isDelete)._id,
			fields: ent.revisions.find((revision) => !revision.isDelete).fields,
			createDate: ent.createDate,
			createBy: ent.createBy,
			updateDate: ent.updateDate,
			updateBy: ent.updateBy
		};
	}

	mappingExactRevisionField(ent, revisionId) {
		if (!ent) {
			return {};
		}
		delete ent.searchInfo;
		delete ent.createAt;
		delete ent.updateAt;
		return {
			_id: ent._id,
			name: ent.name,
			isActive: ent.isActive,
			isDelete: ent.isDelete,
			industry: ent.industry,
			industryName: ent.industryObj ? super.translateContent(ent.industryObj.name) : "",
			revId: ent.revisions.find((revision) => !revision.isDelete)._id,
			fields: ent.revisions.find((revision) => revisionId === revision.id).fields,
			createDate: ent.createDate,
			createBy: ent.createBy,
			updateDate: ent.updateDate,
			updateBy: ent.updateBy
		};
	}

	mappingDocToCompare(doc) {
		if (!doc) {
			return {};
		}
		return {
			_id: doc._id,
			name: doc.name,
			isActive: doc.isActive,
			industry: doc.industry,
			revId: doc.revisions && doc.revisions.length > 0
				? doc.revisions.find((revision) => !revision.isDelete)._id : doc.revId,
			fields: doc.revisions && doc.revisions.length > 0
				? doc.revisions.find((revision) => !revision.isDelete).fields : doc.fields,
		};
	}
}

module.exports = ProductTemplateTransfer;