const _ = require("lodash");
const ResponseCode = require("../../../../defined/response-code");
const { NovaHelpers } = require("../../../../libs");
const BaseLogic = require("./base.logic");
const {ObjectId} = require("bson");
const { hashSync, compareSync } = require("bcryptjs");

class CustomerLogic extends BaseLogic {
	constructor(mainProcess) {
		super(mainProcess);
		this.models = mainProcess.models;
		this.userModel = this.models.UserModel;
		this.groupRoleModel = this.models.GroupRoleModel;
		this.roleModel = this.models.RoleModel;
		this.permissionModel = this.models.PermissionModel;
	}

	async findUserByUserAndPass({userName, password}) {
		const user = await this.userModel.findOne({userName});
		if (_.isEmpty(user) || !compareSync(password, user.password)) {
			return false;
		}
		return super.resInfo(user);
	}

	async getActionsByUserId(accountId) {
		try {
			// get GroupRoles
			const groupRoles = await this.groupRoleModel.getAll({userIds: accountId, isActive: true, isDelete: false});
			let roleIds = groupRoles.reduce((a, b) => {
				a.push(...(b.roleIds || []));
				return a;
			}, []);
			roleIds = roleIds.map(roleId => new ObjectId(roleId));

			// get Roles
			const roles = await this.roleModel.getAll({$or: [{userIds: accountId}, {_id: {$in: roleIds}} ], isActive: true, isDelete: false});
			let permissionIds = roles.reduce((a, b) => {
				a.push(...(b.permissionIds || []));
				return a;
			}, []);
			permissionIds = permissionIds.map(permissionId => new ObjectId(permissionId));

			// get Permissions
			const permissions = await this.permissionModel.getAll({_id: {$in: permissionIds}, isActive: true, isDelete: false});
			let listApiActionName = permissions.reduce((a, b) => {
				a.push(...(b.listApiActionName || []));
				return a;
			}, []);

			return super.resInfo(listApiActionName);
		} catch (err) {
			return super.resErr(ResponseCode.SYS_STATUS_CODE.INTERNAL_SERVER_ERROR, err);
		}
	}

	async validatePassword(password) {
		return (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,30}$/).test(password);
	}
}

module.exports = CustomerLogic;
