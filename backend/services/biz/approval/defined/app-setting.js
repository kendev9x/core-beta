const DB_COLLECTION = {
	APPROVAL_CONFIG: "approval_configs",
	APPROVAL: "approvals"
};

const DEFAULT_LEVELS = [
	{
		level: "reviewer1",
		status: "FIRST-APPROVED",
		label: "Đã xem xét lần 1",
	},
	{
		level: "reviewer2",
		status: "SECOND-APPROVED",
		label: "Đã xem xét lần 2"
	},
	{
		level: "publisher",
		status: "PUBLISH",
		label: "Phát hành"
	}
];

const APPROVAL_STATE = {
	INITIAL: "INITIAL",
	FIRST_REVIEW: "FIRST-REVIEW",
	SECOND_REVIEW: "SECOND-REVIEW",
	PUSBLISH: "PUBLISH",
	REJECT: "REJECT"
};

const ITEM_TYPE = {
	PROJECT: "PROJECT",
	PRODUCT: "PRODUCT",
	ARTICLE: "ARTICLE"
};

const INDUSTRY_CODE_DEFAULT = "BDS";

module.exports = {
	DB_COLLECTION,
	DEFAULT_LEVELS,
	APPROVAL_STATE,
	ITEM_TYPE,
	INDUSTRY_CODE_DEFAULT
};
