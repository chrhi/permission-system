import { PolicyDefinition, PermissionCheck } from "./types";

export class AccessControl<TUser = any> {
  private policy: PolicyDefinition<TUser>;

  constructor(policy: PolicyDefinition<TUser>) {
    this.policy = policy;
  }

  public hasPermission(
    user: TUser,
    resource: string,
    action: string,
    data?: any
  ): boolean {
    const roles = this.getUserRoles(user);
    return roles.some((role) =>
      this.checkRolePermission(role, resource, action, user, data)
    );
  }

  private getUserRoles(user: TUser): string[] {
    return (user as any).roles || [];
  }

  private checkRolePermission(
    role: string,
    resource: string,
    action: string,
    user: TUser,
    data?: any
  ): boolean {
    const rolePolicy = this.policy.roles[role];
    if (!rolePolicy) return false;

    const resourcePolicy = rolePolicy[resource];
    if (!resourcePolicy) return false;

    const permissionCheck = resourcePolicy[action];
    return this.evaluateCheck(permissionCheck, user, data);
  }

  private evaluateCheck(
    check: PermissionCheck | undefined,
    user: TUser,
    data?: any
  ): boolean {
    if (typeof check === "boolean") return check;
    if (typeof check === "function") return check(user, data);
    return false;
  }
}
