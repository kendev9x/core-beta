const { ResponseHelper } = require("../../../../libs/helpers");
const NidConnector = require("../../../../connectors/nid/nid.connector");
const BaseLogic = require("./base.logic");

class IndustryLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.industryModel = this.models.IndustryModel;
		this.nidConnector = new NidConnector(mainProcess);
	}

	/** Logic: Get all industries
	 * @output object: {code, data, message}
	 */
	getAllIndustry() {
		return new Promise((res, rej) => {
			this.industryModel.getAll({})
				.then((result) => {
					/** JUST USE FOR TESTING CONNECTOR */
					this.nidConnector.callApi("feedback", "GET", null)
						.then((result) => {
							console.log(result);
						})
						.catch((e) => {
							this.mainProcess.logger.error(e);
							rej(e);
						});
					/** WILL REMOVE WHEN KIET CAN USE CONNECTOR OK */
					res(ResponseHelper.resInfo(result));
				})
				.catch((err) => {
					this.mainProcess.logger.error(err);
					rej(ResponseHelper.resErr(500, "Processing Failed", 500));
				});
		});
	}
}

module.exports = IndustryLogic;
