const _ = require("lodash");
const request = require("request-promise");
const { NovaStringHelper } = require("../../libs/helpers");
const AlertConnector = require("../alert/alert.connector");

const _CONFIG = {
	SF_ACCOUNT: process.env.SAP_SF_ACCOUNT || "SFAPI_APP@novalandin",
	SF_PASSWORD: process.env.SAP_SF_PASSWORD || "XLq3VbCt7AhEUAmGZc%^",
	SF_URL: process.env.SAP_SF_URL || "https://api10.successfactors.com/odata/v2/",
	SYNC_ALL_CUSTOMER: process.env.SAP_SYNC_ALL_CUSTOMER || true,
	SYNC_DATE_AGO: process.env.SAP_SYNC_DATE_AGO || 1
};

class SFConnector {
	constructor(mainProcess) {
		this.mainProcess = mainProcess || {};
		this.novaHelper = NovaStringHelper;
		this.alertConnector = new AlertConnector(mainProcess);
	}

	getToken() {
		const authorStr = `${_CONFIG.SF_ACCOUNT}:${_CONFIG.SF_PASSWORD}`;
		const token = Buffer.from(authorStr).toString("base64");
		return `Basic ${token}`;
	}

	async setHeader() {
		const authorization = await this.getToken();
		return {
			"Content-Type": "application/json",
			Authorization: authorization
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
		if (responseResult.d && responseResult.d.results) {
			const dataArr = responseResult.d.results;
			containerResult = [...containerResult, ...dataArr];
		}
		if (isGetAll && responseResult.d.__next && !_.isEmpty(responseResult.d.__next)) {
			const nextLinkUrl = responseResult.d.__next;
			containerResult = await this.callEntity(nextLinkUrl, isGetAll, containerResult);
		}
		return containerResult;
	}

	async getListEmployee(reqOptionStr) {
		try {
			let requestUrl = "EmpEmployment?$filter=isPrimary eq 1 and userNav/status in 't'\n"
        + "&$select=userId,lastModifiedOn,userNav/defaultFullName,userNav/jobLevel,\n"
        + "personNav/emailNav/emailAddress,personNav/phoneNav/phoneType,\n"
        + "personNav/phoneNav/phoneNumber,jobInfoNav/jobTitle,userNav/jobLevelNav/externalCode\n"
        + "&$expand=personNav/emailNav,userNav,userNav/jobLevelNav,userNav/manager,userNav/hr,\n"
        + "jobInfoNav,personNav/phoneNav&$orderby=userId,lastModifiedOn asc&$format=JSON";
			if (!_CONFIG.SYNC_ALL_CUSTOMER) {
				const syncDateAgo = parseInt(_CONFIG.SYNC_DATE_AGO, 10);
				const dateSyncStr = this.novaHelper.convertDateTimeToStringISO(Date.now(), syncDateAgo);
				requestUrl = `EmpEmployment?$filter=isPrimary eq 1 
        and lastModifiedOn ge ${dateSyncStr} and userNav/status in 't'\n"
          + "&$select=userId,lastModifiedOn,userNav/defaultFullName,userNav/jobLevel,\n"
          + "personNav/emailNav/emailAddress,personNav/phoneNav/phoneType,\n"
          + "personNav/phoneNav/phoneNumber,jobInfoNav/jobTitle,userNav/jobLevelNav/externalCode\n"
          + "&$expand=personNav/emailNav,userNav,userNav/jobLevelNav,userNav/manager,userNav/hr,\n"
          + "jobInfoNav,personNav/phoneNav&$orderby=userId,lastModifiedOn asc&$format=JSON`;
			}
			let listEmployee = [];
			const req = `${_CONFIG.SF_URL}${requestUrl}`;
			this.mainProcess.logger.info(`Call Success Factor request: ${req}`);
			listEmployee = await this.callEntity(req, true, listEmployee);
			if (!listEmployee || listEmployee.length < 1) {
				return listEmployee;
			}
			this.mainProcess.logger.info(`Total employees from Success Factor: ${listEmployee.length}`);
			listEmployee = listEmployee.map((x) => {
				const { userNav } = x;
				const phoneNav = x.personNav && x.personNav.phoneNav
        && x.personNav.phoneNav.results ? x.personNav.phoneNav.results : [];
				const emailNav = x.personNav && x.personNav.emailNav
        && x.personNav.emailNav.results ? x.personNav.emailNav.results : [];
				const jobLevelNav = x.userNav && x.userNav.jobLevelNav ? x.userNav.jobLevelNav : {};
				const jobInfoNav = x.jobInfoNav && x.jobInfoNav.results ? x.jobInfoNav.results : [];
				const customerPhoneObj = phoneNav.find((k) => parseInt(k.phoneType, 10) !== 3942);
				/** 3942: sim one contact */
				const jobTitleObj = jobInfoNav[0] || {};
				return {
					userId: x.userId,
					fullName: userNav.defaultFullName,
					phoneNumber: customerPhoneObj ? this.novaHelper.convertStringToPhone(customerPhoneObj.phoneNumber) : null,
					personalEmail: emailNav[0] ? emailNav[0].emailAddress : "",
					companyEmail: emailNav[1] ? emailNav[1].emailAddress : "",
					jobLevel: parseInt(jobLevelNav.externalCode, 10),
					jobTitle: jobTitleObj.jobTitle
				};
			});
			const dataReturn = listEmployee.filter((customer) => customer.phoneNumber
        && this.novaHelper.validPhoneNumber(customer.phoneNumber));
			return dataReturn;
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
		}
	}

	async getEmployeeByMSNV(msnv) {
		try {
			const requestUrl = `EmpEmployment?$filter=userId eq '${msnv}' and userNav/status in 't'&
      $select=userId,lastModifiedOn,userNav/defaultFullName,userNav/jobLevel,
      personNav/emailNav/emailAddress,
      personNav/phoneNav/phoneType,personNav/phoneNav/phoneNumber,
      jobInfoNav/jobTitle,userNav/jobLevelNav/externalCode
      &$expand=personNav/emailNav,userNav,userNav/jobLevelNav,userNav/manager,userNav/hr,
      jobInfoNav,personNav/phoneNav&$orderby=userId,lastModifiedOn asc&$format=JSON`;
			let listEmployee = [];
			const req = `${_CONFIG.SF_URL}${requestUrl}`;
			this.mainProcess.logger.info(`Call Success Factor request: ${req}`);
			listEmployee = await this.callEntity(req, true, listEmployee);
			if (!listEmployee || listEmployee.length < 1) {
				return {};
			}
			listEmployee = listEmployee.map((x) => {
				const { userNav } = x;
				const phoneNav = x.personNav && x.personNav.phoneNav
        && x.personNav.phoneNav.results ? x.personNav.phoneNav.results : [];
				const emailNav = x.personNav && x.personNav.emailNav
        && x.personNav.emailNav.results ? x.personNav.emailNav.results : [];
				const jobInfoNav = x.jobInfoNav && x.jobInfoNav.results ? x.jobInfoNav.results : [];
				const customerPhoneObj = phoneNav.find((k) => parseInt(k.phoneType, 10) === 3936);
				const jobLevelNav = x.userNav && x.userNav.jobLevelNav ? x.userNav.jobLevelNav : {};
				const jobTitleObj = jobInfoNav[0] || {};
				return {
					sfUserId: x.userId,
					fullName: userNav.defaultFullName,
					phone: customerPhoneObj ? this.novaHelper.convertStringToPhone(customerPhoneObj.phoneNumber) : null,
					personalEmail: emailNav[0] ? emailNav[0].emailAddress : "",
					companyEmail: emailNav[1] ? emailNav[1].emailAddress : "",
					jobLevel: parseInt(jobLevelNav.externalCode, 10),
					jobTitle: jobTitleObj.jobTitle,
					groupCode: parseInt(jobLevelNav.externalCode, 10) <= 10 ? "NOVA_LEVEL_U10" : "NOVA_LEVEL_O10",
					type: "NOVA-EMP"
				};
			});
			if (listEmployee.length > 0) {
				return _.first(listEmployee);
			}
			return {};
		} catch (e) {
			this.alertConnector.sendError(e);
			this.mainProcess.logger.error(e);
		}
	}
}

module.exports = SFConnector;

// const test = new SFConnector({
//   logger: {
//     info: {},
//     error: {}
//   }
// }).getListEmployee().then((results) => {
//   console.log(results);
// });
