const lodash = require("lodash");
const { Client } = require("@elastic/elasticsearch");
const AlertConnector = require("../alert/alert.connector");

class ElasticConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.client = new Client({
			node: this.mainProcess.config.ELASTIC_URI || process.env.ELASTIC_URI,
			requestTimeout: this.mainProcess.config.ELASTIC_TIMEOUT || process.env.ELASTIC_TIMEOUT
		});
		this.alertConnector = new AlertConnector(mainProcess);
	}

	/** Get correct index contains data on ES: numIndex: 1: BDS - 2: Fitness - 3: F&B */
	getIndex(numIndex) {
		if (!numIndex) {
			return null;
		}
		numIndex = parseInt(numIndex, 10);
		if (!lodash.isNumber(numIndex)) {
			return null;
		}
		let index = null;
		switch (numIndex) {
			case 1:
				index = process.env.ELASTIC_INDEX_PRODUCT_BDS || "nvlp-dev-products-bds";
				return index;
			case 2:
				index = process.env.ELASTIC_INDEX_PRODUCT_FITNESS || "nvlp-dev-products-citigym";
				return index;
			case 3:
				index = process.env.ELASTIC_INDEX_PRODUCT_FAB || "nvlp-dev-products-fab";
				return index;
			case 4:
				index = process.env.ELASTIC_INDEX_PRODUCT_ECM || "nvlp-dev-products-ecm";
				return index;
			default:
				return null;
		}
	}

	async syncProduct(listProduct, numIndexEs) {
		try {
			const esIndex = this.getIndex(numIndexEs);
			if (!esIndex) {
				return false;
			}
			if (!listProduct || listProduct.length < 1) {
				return false;
			}
			const body = listProduct.flatMap((doc) => [{
				index: {
					_index: esIndex,
					_id: doc.id
				}
			}, doc]);
			const { body: bulkResponse } = await this.client.bulk({ refresh: true, body });
			if (bulkResponse.errors) {
				this.alertConnector.sendError(new Error(JSON.stringify(bulkResponse)));
				this.mainProcess.logger.error(`sync product to elastic failed: ${JSON.stringify(bulkResponse)}`);
				return false;
			}
			return true;
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(`sync product to elastic failed: ${e.message}`);
			this.mainProcess.logger.error(e);
			return false;
		}
	}

	async updateProduct(listProduct, numIndexEs) {
		try {
			const esIndex = this.getIndex(numIndexEs);
			if (!esIndex) {
				return false;
			}
			const result = Promise.all(listProduct.map(async (productObj) => {
				if (!productObj || !productObj.id) {
					return false;
				}
				const updateObj = {
					index: esIndex,
					id: productObj.id,
					body: {
						doc: productObj
					}
				};
				this.client.get({
					index: esIndex,
					id: productObj.id
				}, async (api, res) => {
					if (!res.body.found) {
						const isSave = await this.syncProduct([productObj], numIndexEs);
						console.log(isSave);
					} else {
						this.client.update(updateObj);
					}
				});
				return productObj;
			}));
			await result;
			return true;
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(`update product to elastic failed: ${e.message}`);
			this.mainProcess.logger.error(e);
			return false;
		}
	}

	async deleteProduct(listProduct, numIndexEs) {
		try {
			if (!listProduct || !lodash.isArray(listProduct) || listProduct.length < 0) {
				return false;
			}
			const esIndex = this.getIndex(numIndexEs);
			if (!esIndex) {
				return false;
			}
			const result = [];
			listProduct.map(async (productObj) => {
				if (!productObj || !productObj.id) {
					return productObj;
				}
				const deleteObj = {
					index: esIndex,
					id: productObj.id,
					body: {
						doc: productObj
					}
				};
				const res = await this.client.delete(deleteObj);
				if (res.statusCode === 200) {
					result.push(productObj.id);
				}
				return productObj;
			});
			return result;
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(`delete product to elastic failed: ${e.message}`);
			this.mainProcess.logger.error(e);
			return false;
		}
	}

	async deleteALl(numIndexEs) {
		try {
			const esIndex = this.getIndex(numIndexEs);
			if (!esIndex) {
				return false;
			}
			const deleteObj = {
				index: esIndex,
				body: {
					query: {
						match_all: {}
					}
				}
			};
			const res = await this.client.deleteByQuery(deleteObj);
			return res.statusCode === 200;
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(`delete product to elastic failed: ${e.message}`);
			this.mainProcess.logger.error(e);
			return false;
		}
	}

	async searchProduct(numIndexEs, queryFilter, sortArr, skip = 0, limit = 20) {
		try {
			const esIndex = this.getIndex(numIndexEs);
			if (!esIndex) {
				return false;
			}
			skip = Number.parseInt(skip, 10);
			limit = Number.parseInt(limit, 10);
			if (Number.isNaN(skip)) {
				skip = 0;
			}
			if (Number.isNaN(limit)) {
				limit = 20;
			}
			const bodyFilter = {
				query: queryFilter,
				sort: sortArr,
				from: skip,
				size: limit
			};
			const response = await this.client.search({
				index: esIndex,
				body: bodyFilter
			});
			if (response.body.hits && response.body.hits.hits) {
				return response.body.hits.hits.map((x) => x._source);
			}
			return [];
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(`search product to elastic failed: ${e.message}`);
			this.mainProcess.logger.error(e);
			return [];
		}
	}
}

module.exports = ElasticConnector;
