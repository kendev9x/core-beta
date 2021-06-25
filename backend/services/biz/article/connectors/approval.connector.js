const _ = require("lodash");
const Base = require("./base.connector");

class ApprovalConnector extends Base {
  constructor(mainProcess) {
    super();
    // this.logger = mainProcess.logger;
  }

  async getApprovalMasterConfig(ctx) {
    try {
      const data = await super.callCoreApi(ctx, "v1.approval.getMasterConfigForProject", {});
      if (data) {
        return data;
      }
      return {};
    } catch (e) {
      throw e.message;
    }
  }

  async getAllApprovalItemsByCurrentUser(ctx, itemType, mainId = "") {
    try {
      const data = await super.callCoreApi(ctx, "v1.approval.getAllApprovalByAccount", {query: {itemType, mainId}});
      if (data && data.length > 0) {
        return data;
      }
      return [];
    } catch (e) {
      throw e.message;
    }
  }

  async getAllApprovalItemsByUserEditor(ctx) {
    try {
      const params = super.getParamsByMethodType(ctx);
      const data = await super.callCoreApi(ctx, "v1.approval.getAllApprovalItemsByUserEditor", params);
      if (data && data.length > 0) {
        return data;
      }
      return [];
    } catch (e) {
      throw e.message;
    }
  }

  async getAllApprovalItemsByApprovalPersonAndType(ctx, itemType) {
    try {
      const data = await super.callCoreApi(ctx, "v1.approval.getAllApprovalItemsByApprovalPersonAndType",
        {query: {itemType}});
      if (data && data.length > 0) {
        return data;
      }
      return [];
    } catch (e) {
      throw e.message;
    }
  }

  async getApprovalByItemId(ctx, itemId) {
    try {
      const data = await super.callCoreApi(ctx, "v1.approval.getApprovalByItemId", { query: { itemId } });
      if (data) {
        return data;
      }
      return {};
    } catch (e) {
      throw e.message;
    }
  }
}

module.exports = ApprovalConnector;
