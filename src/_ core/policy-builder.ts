import { PolicyDefinition, ResourcePolicy, PermissionCheck } from "./types";

export class PolicyBuilder<TUser = any> {
  private policy: PolicyDefinition<TUser> = { roles: {} };

  forRole(role: string): PolicyBuilderRole<TUser> {
    if (!this.policy.roles[role]) {
      this.policy.roles[role] = {};
    }

    return new PolicyBuilderRole(this, role);
  }

  updatePolicy(
    role: string,
    resource: string,
    actions: ResourcePolicy<any, TUser>
  ): void {
    if (!this.policy.roles[role]) {
      this.policy.roles[role] = {};
    }
    this.policy.roles[role][resource] = actions;
  }

  build(): PolicyDefinition<TUser> {
    return this.policy;
  }
}

class PolicyBuilderRole<TUser = any> {
  constructor(
    private readonly builder: PolicyBuilder<TUser>,
    private readonly role: string
  ) {}

  onResource<TData = any>(
    resource: string
  ): PolicyBuilderResource<TData, TUser> {
    return new PolicyBuilderResource(this.builder, this.role, resource);
  }
}

class PolicyBuilderResource<TData = any, TUser = any> {
  constructor(
    private readonly builder: PolicyBuilder<TUser>,
    private readonly role: string,
    private readonly resource: string
  ) {}

  can(
    actions: Record<string, PermissionCheck<TData, TUser>>
  ): PolicyBuilder<TUser> {
    this.builder.updatePolicy(
      this.role,
      this.resource,
      actions as ResourcePolicy<any, TUser>
    );
    return this.builder;
  }
}
