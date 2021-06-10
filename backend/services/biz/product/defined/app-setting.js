const DB_COLLECTION = {
	INDUSTRY: "industries",
	PRODUCT: "products",
	PRODUCT_TEMPLATE: "product_templates",
	PRODUCT_CUSTOMER: "product_customers",
	PRODUCT_FILTER_CONFIG: "product_filter_configs",
	ENTITY_TYPE: "entity_types",
	ENTITY: "entities",
	RELATION_TYPE: "relation_types",
	RELATION: "relations"
};
const DEFAULT_LANGUAGE_CODE = "vi";
const INDUSTRIES = [
	{
		id: "5e7dc2195bca4b93fb920c79",
		code: "BDS",
		esIndex: 1
	},
	{
		id: "5e7c66269573862bf8079244",
		code: "CTG",
		esIndex: 2
	},
	{
		id: "5e7dc1e85bca4b93fb920c44",
		code: "FAB",
		esIndex: 3
	},
	{
		id: "5f3a5846ad2f5d48a0b07cdf",
		code: "ECM",
		esIndex: 4
	},
	{
		id: "5f866278a975425fae052907",
		code: "HMG",
		esIndex: 5
	}
];
const PRODUCT_TYPE = {
	CITIGYM: {
		SERVICE: 1,
		GOODS: 2,
		CARD: 3
	}
};
const APPROVE_INDUSTRY = {
	BDS: {
		CODE: "BDS",
		ID: "5e7dc2195bca4b93fb920c79",
	}
};
module.exports = {
	DB_COLLECTION,
	DEFAULT_LANGUAGE_CODE,
	INDUSTRIES,
	PRODUCT_TYPE,
	APPROVE_INDUSTRY
};
