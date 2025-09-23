# 📚 API Reference

Complete documentation for all Drakonis Guard classes, methods, and types.

## 🏗️ Core Classes

### PolicyBuilder

The main class for building access control policies using a fluent interface.

#### Constructor

```typescript
new PolicyBuilder<TUser = any>()
```

**Parameters:**
- `TUser` (optional): TypeScript type for user objects

**Returns:** `PolicyBuilder<TUser>`

#### Methods

##### `forRole(role: string): PolicyBuilderRole<TUser>`

Defines a role and returns a role-specific builder.

**Parameters:**
- `role: string` - The role name

**Returns:** `PolicyBuilderRole<TUser>` - Role-specific builder

**Example:**
```typescript
const builder = new PolicyBuilder()
  .forRole('admin'); // Returns PolicyBuilderRole
```

##### `build(): PolicyDefinition<TUser>`

Builds and returns the final policy definition.

**Returns:** `PolicyDefinition<TUser>` - Complete policy definition

**Example:**
```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ read: true })
  .build(); // Returns PolicyDefinition
```

### PolicyBuilderRole

Intermediate builder for defining role-specific permissions.

#### Methods

##### `onResource<TData = any>(resource: string): PolicyBuilderResource<TData, TUser>`

Defines a resource for the current role and returns a resource-specific builder.

**Parameters:**
- `resource: string` - The resource name
- `TData` (optional): TypeScript type for resource objects

**Returns:** `PolicyBuilderResource<TData, TUser>` - Resource-specific builder

**Example:**
```typescript
const builder = new PolicyBuilder()
  .forRole('admin')
  .onResource<Article>('article'); // Returns PolicyBuilderResource
```

### PolicyBuilderResource

Final builder for defining resource-specific permissions.

#### Methods

##### `can(actions: Record<string, PermissionCheck<TData, TUser>>): PolicyBuilder<TUser>`

Defines permissions for the current role-resource combination.

**Parameters:**
- `actions: Record<string, PermissionCheck<TData, TUser>>` - Object mapping action names to permission checks

**Returns:** `PolicyBuilder<TUser>` - Returns to main builder for chaining

**Example:**
```typescript
const builder = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({
    read: true,
    write: (user, article) => user.id === article.authorId
  }); // Returns PolicyBuilder for chaining
```

### AccessControl

The main class for checking permissions against a policy.

#### Constructor

```typescript
new AccessControl<TUser = any>(policy: PolicyDefinition<TUser>)
```

**Parameters:**
- `policy: PolicyDefinition<TUser>` - The policy definition to use

**Returns:** `AccessControl<TUser>`

**Example:**
```typescript
const policy = new PolicyBuilder().build();
const guardian = new AccessControl(policy);
```

#### Methods

##### `hasPermission(user: TUser, resource: string, action: string, data?: any): boolean`

Checks if a user has permission to perform an action on a resource.

**Parameters:**
- `user: TUser` - The user object (must have a `roles` property)
- `resource: string` - The resource name
- `action: string` - The action name
- `data?: any` - Optional resource data for dynamic permission checks

**Returns:** `boolean` - `true` if permission is granted, `false` otherwise

**Example:**
```typescript
const user = { id: '123', roles: ['admin'] };
const article = { id: '456', authorId: '123' };

const canEdit = guardian.hasPermission(user, 'article', 'edit', article);
```

## 🎭 Types

### PermissionCheck

```typescript
type PermissionCheck<TData = any, TUser = any> = 
  | boolean 
  | ((user: TUser, data?: TData) => boolean);
```

A permission check can be either:
- A boolean value (always true or false)
- A function that takes a user and optional data, returning a boolean

**Example:**
```typescript
// Boolean permission
const booleanCheck: PermissionCheck = true;

// Function permission
const functionCheck: PermissionCheck<User, Article> = (user, article) => {
  return user.id === article?.authorId;
};
```

### ResourcePolicy

```typescript
type ResourcePolicy<TData = any, TUser = any> = {
  [action: string]: PermissionCheck<TData, TUser>;
};
```

A mapping of action names to permission checks for a specific resource.

**Example:**
```typescript
const articlePolicy: ResourcePolicy<Article, User> = {
  read: true,
  write: (user, article) => user.id === article.authorId,
  delete: (user, article) => user.id === article.authorId && article.status === 'draft'
};
```

### RolePolicy

```typescript
type RolePolicy<TUser = any> = {
  [resource: string]: ResourcePolicy<any, TUser>;
};
```

A mapping of resource names to resource policies for a specific role.

**Example:**
```typescript
const adminPolicy: RolePolicy<User> = {
  article: {
    read: true,
    write: true,
    delete: true
  },
  user: {
    read: true,
    update: true,
    delete: (user, targetUser) => user.id !== targetUser.id
  }
};
```

### PolicyDefinition

```typescript
type PolicyDefinition<TUser = any> = {
  roles: {
    [roleName: string]: RolePolicy<TUser>;
  };
};
```

The complete policy definition containing all roles and their permissions.

**Example:**
```typescript
const policy: PolicyDefinition<User> = {
  roles: {
    admin: {
      article: { read: true, write: true, delete: true },
      user: { read: true, update: true, delete: true }
    },
    author: {
      article: { 
        read: true, 
        write: (user, article) => user.id === article.authorId,
        delete: (user, article) => user.id === article.authorId
      }
    }
  }
};
```

## 🔧 Utility Functions

### User Role Extraction

The `AccessControl` class automatically extracts roles from user objects by looking for a `roles` property:

```typescript
// User object must have a 'roles' property
const user = { 
  id: '123', 
  roles: ['admin', 'author'] // This property is required
};

// The AccessControl class will automatically extract ['admin', 'author']
```

### Permission Aggregation

When a user has multiple roles, permissions are checked across all roles using OR logic:

```typescript
// If ANY role grants permission, the user has permission
const user = { roles: ['author', 'moderator'] };

// This will return true if EITHER 'author' OR 'moderator' role grants permission
guardian.hasPermission(user, 'article', 'read');
```

### Wildcard Permissions

Use `'*'` as an action name to grant all permissions for a resource:

```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ '*': true }) // Admin can perform any action on articles
  .build();
```

## 🎯 Error Handling

### Invalid Role

If a user has a role that doesn't exist in the policy, that role is ignored:

```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ read: true })
  .build();

const user = { roles: ['admin', 'nonexistent'] };
// The 'nonexistent' role will be ignored, only 'admin' permissions are checked
```

### Missing Resource

If a role doesn't have permissions for a specific resource, access is denied:

```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ read: true })
  .build();

const user = { roles: ['admin'] };
guardian.hasPermission(user, 'user', 'read'); // false - no permissions for 'user' resource
```

### Missing Action

If a role doesn't have permissions for a specific action on a resource, access is denied:

```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ read: true })
  .build();

const user = { roles: ['admin'] };
guardian.hasPermission(user, 'article', 'write'); // false - no 'write' permission
```

---

*For more examples and advanced usage patterns, see the [Examples](./examples.md) guide.* 🐉
