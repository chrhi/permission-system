export type PermissionCheck<TData = any, TUser = any> =
  | boolean
  | ((user: TUser, data?: TData) => boolean);

export type ResourcePolicy<TData = any, TUser = any> = {
  [action: string]: PermissionCheck<TData, TUser>;
};

export type RolePolicy<TUser = any> = {
  [resource: string]: ResourcePolicy<any, TUser>;
};

export type PolicyDefinition<TUser = any> = {
  roles: {
    [roleName: string]: RolePolicy<TUser>;
  };
};
