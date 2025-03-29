import { PolicyDefinition, ResourcePolicy } from "./types";

export class PolicyBuilder<TUser = any> {
  private policy: PolicyDefinition<TUser> = { roles: {} };

  forRole(role: string) {
    if (!this.policy.roles[role]) {
      this.policy.roles[role] = {};
    }

    return {
      onResource: <TData = any>(resource: string) => ({
        can: (actions: Record<string, ResourcePolicy<TData, TUser>>) => {
          this.policy.roles[role][resource] = actions;
          return this;
        },
      }),
    };
  }

  build(): PolicyDefinition<TUser> {
    return this.policy;
  }
}
