const _ = require("lodash");

class BaseConnector {
  async callCoreApi(ctx, url, params = {}) {
    try {
      return await ctx.call(url, params).then((result) => {
        if (result.code >= 200 && result.code <= 299) {
          return result.data;
        }
        return null;
      });
    } catch (e) {
      throw Error(e);
    }
  }

  getParamsByMethodType(context) {
    let params = {};
    if (context.params.query && (!context.params.body
      || _.isEmpty(context.params.body))
      && (!context.params.params || _.isEmpty(context.params.params))) {
      params = {
        query: context.params.query
      };
    } else if (context.params.body
      && (!context.params.params || _.isEmpty(context.params.params))) {
      params = {
        body: context.params.body
      };
    } else if (context.params.params) {
      params = {
        params: context.params.params
      };
    }
    params = _.isUndefined(params) ? {} : params;
    return params;
  }
}

module.exports = BaseConnector;