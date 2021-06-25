const _ = require("lodash");
const request = require("request-promise");
const { NovaStringHelper } = require("../../libs/helpers");
const AlertConnector = require("../alert/alert.connector");

/** This config for connector CRM will move to env file */
const _CONFIG = {
	ORG_URL: process.env.CRM_ORG_URL || "https://novaland-uat.crm5.dynamics.com/1",
	CLIENT_ID: process.env.CRM_CLIENT_ID || "25e1a764-38c9-469a-98c3-7daaa797e1d81",
	TENAND_ID: process.env.CRM_TENAND_ID || "1fd1dfc4-e5e3-4d37-addb-3eca411ecaec1",
	CLIENT_SECRECT: process.env.CRM_CLIENT_SECRECT || "2yAzXkdo23KCKZp_R-nfD99t~-RM94I.bX1",
	AUTH_ENDPOINT: process.env.CRM_AUTH_ENDPOINT || "https://login.microsoftonline.com/1",
	API_URL: process.env.CRM_API_URL || "https://novaland-uat.crm5.dynamics.com/api/data/v9.1/1",
	SYNC_ALL_TIER: process.env.CRM_SYNC_ALL_TIER || false,
	SYNC_ALL_LOYALTY: process.env.CRM_SYNC_ALL_LOYALTY || false,
	SYNC_DATE_AGO: process.env.CRM_SYNC_DATE_AGO || 1,
	ENTITIES: {
		LOYALTY_DIC_TIER: "dic_tiers",
		LOYALTY_DIC_LOYALTY_CARD: "dic_loyaltycardses",
		ACCOUNT: "accounts",
		CONTACT: "contacts",
		CARDS: "dic_cardmanagements"
	}
};

let _authObj = {};
class CrmConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess;
		this.novaHelper = NovaStringHelper;
		this.alertConnector = new AlertConnector(mainProcess);
	}

	/** COMMON FUNC */
	async getToken() {
		if (!_.isEmpty(_authObj)) {
			return _authObj;
		}
		const requestFromData = {
			client_id: _CONFIG.CLIENT_ID,
			resource: _CONFIG.ORG_URL,
			client_secret: _CONFIG.CLIENT_SECRECT,
			grant_type: "client_credentials"
		};
		const requestObj = {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			uri: `${_CONFIG.AUTH_ENDPOINT}${_CONFIG.TENAND_ID}/oauth2/token`,
			form: requestFromData,
			method: "POST"
		};
		return new Promise((resolve, reject) => {
			request(requestObj)
				.then((response) => {
					const responseResult = JSON.parse(response);
					if (responseResult.access_token) {
						_authObj = responseResult;
						resolve(_authObj);
					}
				})
				.catch((err) => {
					this.alertConnector.sendError(err);
					this.mainProcess.logger.error(err);
					reject(err);
				});
		});
	}

	async setHeader() {
		await this.getToken();
		return {
			"Content-Type": "application/json",
			Authorization: `Bearer ${_authObj.access_token}`
		};
	}

	async callEntity(requestUrl, isGetAll = false, containerResult = []) {
		const header = await this.setHeader();
		const requestObj = {
			headers: header,
			uri: `${requestUrl}`,
			method: "GET"
		};
		const response = await request(requestObj);
		const responseResult = JSON.parse(response);
		if (responseResult.statusCode === 401) {
			/** Token expired */
			await this.getToken();
		}
		if (responseResult.value) {
			containerResult = [...containerResult, ...responseResult.value];
		}
		if (isGetAll && responseResult["@odata.nextLink"] && !_.isEmpty(responseResult["@odata.nextLink"])) {
			const nextLinkUrl = responseResult["@odata.nextLink"];
			containerResult = await this.callEntity(nextLinkUrl, isGetAll, containerResult);
		}
		return containerResult;
	}

	async getTotalRecord(entityName, filterStr = "") {
		try {
			const header = await this.setHeader();
			const filterOptions = _.isEmpty(filterStr) ? "" : `?$filter=${filterStr}`;
			const requestUrl = `${_CONFIG.API_URL}${entityName}/$count?${filterOptions}`;
			const totalRecord = await request({
				headers: header,
				uri: requestUrl,
				method: "GET"
			});
			return parseInt(totalRecord, 10);
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return -1;
		}
	}

	async getAllEntity() {
		const header = await this.setHeader();
		const requestUrl = `${_CONFIG.API_URL}`;
		const requestObj = {
			headers: header,
			uri: `${requestUrl}`,
			method: "GET"
		};
		return new Promise((resolve, reject) => {
			request(requestObj)
				.then((response) => {
					const responseResult = JSON.parse(response);
					if (responseResult.value) {
						resolve(responseResult.value);
					}
				})
				.catch((err) => {
					this.alertConnector.sendError(err);
					this.mainProcess.logger.error(err);
					reject(err);
				});
		});
	}

	/** LOGIC BUSINESS FUNC */
	async getAllTiers(reqOptionStr) {
		try {
			let requestFilter = "?$orderby=dic_level,createdon,modifiedon asc";
			if (!_CONFIG.SYNC_ALL_TIER) {
				const syncDateAgo = parseInt(_CONFIG.SYNC_DATE_AGO, 10);
				const dateSyncStr = this.novaHelper.convertDateTimeToStringISO(Date.now(), syncDateAgo);
				requestFilter = `?$filter=modifiedon ge ${dateSyncStr} 
      and dic_status eq 1&$orderby=dic_level,createdon,modifiedon asc`;
			}
			/** Use for logic need to get data view from Nova system */
			requestFilter = _.isEmpty(reqOptionStr) ? requestFilter : reqOptionStr;
			const requestUrl = `${_CONFIG.API_URL}${_CONFIG.ENTITIES.LOYALTY_DIC_TIER}${requestFilter}`;
			this.mainProcess.logger.info(`Call CRM request loyalty tier: ${requestUrl}`);
			const tiers = await this.callEntity(requestUrl);
			this.mainProcess.logger.info(`Total loyalty tier from CRM: ${tiers.length}`);
			if (tiers && tiers.length > 0) {
				return tiers;
			}
			return [];
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return [];
		}
	}

	async getAllTierMappingProps(reqOptionStr) {
		try {
			let requestFilter = "?$orderby=dic_level,createdon,modifiedon asc";
			if (!_CONFIG.SYNC_ALL_TIER) {
				const syncDateAgo = parseInt(_CONFIG.SYNC_DATE_AGO, 10);
				const dateSyncStr = this.novaHelper.convertDateTimeToStringISO(Date.now(), syncDateAgo);
				requestFilter = `?$filter=modifiedon ge ${dateSyncStr} 
      and dic_status eq 1&$orderby=dic_level,createdon,modifiedon asc`;
			}
			/** Use for logic need to get data view from Nova system */
			requestFilter = _.isEmpty(reqOptionStr) ? requestFilter : reqOptionStr;
			const requestUrl = `${_CONFIG.API_URL}${_CONFIG.ENTITIES.LOYALTY_DIC_TIER}${requestFilter}`;
			this.mainProcess.logger.info(`Call CRM request loyalty tier: ${requestUrl}`);
			const tiers = await this.callEntity(requestUrl);
			this.mainProcess.logger.info(`Total loyalty tier from CRM: ${tiers.length}`);
			if (tiers && tiers.length > 0) {
				const listTierReturn = [];
				tiers.map((tierObj) => {
					const tierMap = {
						name: tierObj.dic_name,
						code: tierObj.dic_name.toUpperCase(),
						minimumPoint: tierObj.dic_minimumavailablepoint,
						level: tierObj.dic_level,
						tierRefId: tierObj.dic_tierid,
						pointTransferred: tierObj.dic_pointtransferred,
						description: tierObj.dic_description,
						createdon: tierObj.createdon,
						startDate: tierObj.dic_startdate
					};
					listTierReturn.push(tierMap);
					return tierObj;
				});
				return listTierReturn;
			}
			return [];
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return [];
		}
	}

	async getAllLoyalty(reqOptionStr) {
		try {
			let requestFilter = "?$filter=dic_status eq 1&$orderby=createdon,modifiedon desc";
			if (!_CONFIG.SYNC_ALL_LOYALTY) {
				const syncDateAgo = parseInt(_CONFIG.SYNC_DATE_AGO, 10);
				const dateSyncStr = this.novaHelper.convertDateTimeToStringISO(Date.now(), syncDateAgo);
				requestFilter = `?$filter=modifiedon ge ${dateSyncStr} 
    and dic_status eq 1&$orderby=createdon,modifiedon desc`;
			}
			/** Use for logic need to get data view from Nova system */
			requestFilter = _.isEmpty(reqOptionStr) ? requestFilter : reqOptionStr;
			const requestUrl = `${_CONFIG.API_URL}${_CONFIG.ENTITIES.LOYALTY_DIC_LOYALTY_CARD}${requestFilter}`;
			this.mainProcess.logger.info(`Call CRM request loyalty: ${requestUrl}`);
			let loyalties = await this.callEntity(requestUrl);
			if (!loyalties || loyalties.length < 1) {
				return loyalties;
			}
			const accounts = await this.getAllAccount();
			const contacts = await this.getAllContact();
			const cardManagements = await this.getAllCardManagement();
			const tiers = await this.getAllTiers();
			loyalties = loyalties.map((loyaltyObj) => {
				const accountObj = accounts.find((k) => k.accountid === loyaltyObj._dic_customer_value);
				const contactObj = contacts.find((k) => k.contactid === loyaltyObj._dic_customer_value);

				const cardObj = cardManagements.find((k) => k.dic_cardmanagementid
          === loyaltyObj._dic_cardid_value);
				const tierObj = tiers.find((k) => k.dic_tierid === loyaltyObj._dic_tier_value);
				const loyaltyObjMap = {
					loyaltyRefId: loyaltyObj.dic_uniquecode,
					loyaltyCardNo: cardObj ? cardObj.dic_cardid : "",
					startDate: loyaltyObj.dic_startdate,
					endDate: loyaltyObj.dic_dateexpiredtier,
					sapCode: loyaltyObj.dic_sapcode,
					tier: tierObj ? tierObj.dic_name : "",
					totalPoints: loyaltyObj.dic_totalpoints,
					totalAvailablePoint: loyaltyObj.dic_totalavailablepoints,
					createdOn: loyaltyObj.createdon,
				};
				if (contactObj) {
					loyaltyObjMap.customerName = contactObj.fullname;
					loyaltyObjMap.address = contactObj.address1_composite;
					loyaltyObjMap.email = contactObj.emailaddress1 || contactObj.emailaddress2;
					loyaltyObjMap.phoneNumber = contactObj.telephone1 || contactObj.telephone2;
					loyaltyObjMap.cmnd = contactObj.dic_idnocustomercertificateissue;
					loyaltyObjMap.cmndDateProvide = contactObj.dic_customercertificateissuedate;
					loyaltyObjMap.cmndDateExpried = contactObj.dic_customercertificateexpirydate;
					loyaltyObjMap.cmndAddressProvide = contactObj.dic_customercertificateissueadd;
					loyaltyObjMap.dob = contactObj.birthdate;
					loyaltyObjMap.customerType = "C";
					loyaltyObjMap.customerRefId = contactObj.contactid;
				} else if (accountObj) {
					loyaltyObjMap.customerName = accountObj.name;
					loyaltyObjMap.address = accountObj.address1_composite;
					loyaltyObjMap.email = accountObj.emailaddress1 || accountObj.emailaddress2;
					loyaltyObjMap.phoneNumber = accountObj.telephone1 || accountObj.telephone2;
					loyaltyObjMap.customerType = "A";
					loyaltyObjMap.customerRefId = accountObj.accountid;
				}
				return loyaltyObjMap;
			});
			this.mainProcess.logger.info(`Total loyalty from CRM: ${loyalties.length}`);
			return loyalties;
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return [];
		}
	}

	async getAllAccount(reqOptionStr) {
		try {
			reqOptionStr = _.isEmpty(reqOptionStr) ? "?$orderby=createdon,modifiedon desc" : reqOptionStr;
			const requestUrl = `${_CONFIG.API_URL}${_CONFIG.ENTITIES.ACCOUNT}${reqOptionStr}`;
			return await this.callEntity(requestUrl, true);
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return [];
		}
	}

	async getAllContact(reqOptionStr) {
		try {
			reqOptionStr = _.isEmpty(reqOptionStr) ? "?$orderby=createdon desc"
        + "&$select=contactid,dic_fullname,fullname,dic_tier,dic_registeredloyaltydate,"
        + "_dic_loyaltycard_value,birthdate,emailaddress1,emailaddress2,address1_composite,"
        + "telephone1,nickname,telephone2,createdon,modifiedon" : reqOptionStr;
			const requestUrl = `${_CONFIG.API_URL}${_CONFIG.ENTITIES.CONTACT}${reqOptionStr}`;
			return await this.callEntity(requestUrl, true);
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return [];
		}
	}

	async getAllCardManagement(reqOptionStr) {
		try {
			reqOptionStr = _.isEmpty(reqOptionStr)
				? "?$orderby=createdon,modifiedon desc&$select=dic_cardid,"
        + "dic_cardmanagementid,_dic_loyaltycard_value,createdon,modifiedon"
				: reqOptionStr;
			const requestUrl = `${_CONFIG.API_URL}${_CONFIG.ENTITIES.CARDS}${reqOptionStr}`;
			return await this.callEntity(requestUrl, true);
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
			return [];
		}
	}
}

module.exports = CrmConnector;

/** TESTING */
// const crmConnector = new CrmConnector({});
// crmConnector.getAllLoyalty().then((result) => {
//   console.log(result);
// });
