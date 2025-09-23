# 🔄 Migration Guide

Guide for migrating from other access control libraries to Drakonis Guard.

## 📋 Table of Contents

- [From AccessControl](#from-accesscontrol)
- [From CASL](#from-casl)
- [From Custom Solutions](#from-custom-solutions)
- [Migration Checklist](#migration-checklist)

## 🔄 From AccessControl

If you're migrating from the popular `accesscontrol` library, here's how to convert your policies:

### Before (AccessControl)

```typescript
import AccessControl from 'accesscontrol';

const ac = new AccessControl();

ac.grant('user')
  .readOwn('article')
  .updateOwn('article')
  .deleteOwn('article');

ac.grant('admin')
  .extend('user')
  .readAny('article')
  .updateAny('article')
  .deleteAny('article');

// Usage
const permission = ac.can('user').readOwn('article');
if (permission.granted) {
  // User can read own article
}
```

### After (Drakonis Guard)

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user, article) => user.id === article.authorId,
    update: (user, article) => user.id === article.authorId,
    delete: (user, article) => user.id === article.authorId
  })
  .forRole('admin')
  .onResource('article')
  .can({
    read: true,
    update: true,
    delete: true
  })
  .build();

const guardian = new AccessControl(policy);

// Usage
if (guardian.hasPermission(user, 'article', 'read', article)) {
  // User can read article
}
```

### Key Differences

| AccessControl | Drakonis Guard |
|---------------|----------------|
| `grant('role')` | `forRole('role')` |
| `readOwn('resource')` | `can({ read: (user, resource) => user.id === resource.ownerId })` |
| `readAny('resource')` | `can({ read: true })` |
| `permission.granted` | `guardian.hasPermission(...)` |
| Role inheritance | Multiple roles per user |

## 🔄 From CASL

If you're migrating from CASL (Code Access Security Library), here's the conversion:

### Before (CASL)

```typescript
import { AbilityBuilder, Ability } from '@casl/ability';

const { can, cannot, build } = new AbilityBuilder(Ability);

can('read', 'Article', { authorId: { $eq: 'user.id' } });
can('update', 'Article', { authorId: { $eq: 'user.id' } });
can('delete', 'Article', { authorId: { $eq: 'user.id' } });

can('manage', 'all'); // Admin can do everything

const ability = build();

// Usage
if (ability.can('read', 'Article', article)) {
  // User can read article
}
```

### After (Drakonis Guard)

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('Article')
  .can({
    read: (user, article) => user.id === article.authorId,
    update: (user, article) => user.id === article.authorId,
    delete: (user, article) => user.id === article.authorId
  })
  .forRole('admin')
  .onResource('*')
  .can({ '*': true })
  .build();

const guardian = new AccessControl(policy);

// Usage
if (guardian.hasPermission(user, 'Article', 'read', article)) {
  // User can read article
}
```

### Key Differences

| CASL | Drakonis Guard |
|------|----------------|
| `can('action', 'Resource', conditions)` | `can({ action: (user, resource) => condition })` |
| `manage` | `'*'` |
| `all` | `'*'` |
| MongoDB-style conditions | JavaScript functions |
| `ability.can()` | `guardian.hasPermission()` |

## 🔄 From Custom Solutions

If you have a custom access control solution, here's how to migrate:

### Before (Custom Solution)

```typescript
class CustomAccessControl {
  private permissions: Map<string, string[]> = new Map();
  
  grant(role: string, resource: string, actions: string[]) {
    const key = `${role}:${resource}`;
    this.permissions.set(key, actions);
  }
  
  can(user: any, resource: string, action: string): boolean {
    for (const role of user.roles) {
      const key = `${role}:${resource}`;
      const actions = this.permissions.get(key);
      if (actions && actions.includes(action)) {
        return true;
      }
    }
    return false;
  }
}

const ac = new CustomAccessControl();
ac.grant('user', 'article', ['read', 'update']);
ac.grant('admin', 'article', ['read', 'update', 'delete']);

// Usage
if (ac.can(user, 'article', 'read')) {
  // User can read article
}
```

### After (Drakonis Guard)

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: true,
    update: true
  })
  .forRole('admin')
  .onResource('article')
  .can({
    read: true,
    update: true,
    delete: true
  })
  .build();

const guardian = new AccessControl(policy);

// Usage
if (guardian.hasPermission(user, 'article', 'read')) {
  // User can read article
}
```

## 📋 Migration Checklist

### 1. Analyze Current System

- [ ] List all roles in your current system
- [ ] List all resources and actions
- [ ] Document current permission logic
- [ ] Identify any dynamic permission checks

### 2. Design New Policy

- [ ] Map roles to Drakonis Guard roles
- [ ] Map resources to Drakonis Guard resources
- [ ] Convert static permissions to boolean values
- [ ] Convert dynamic permissions to functions

### 3. Implement Migration

- [ ] Create new policy using PolicyBuilder
- [ ] Implement permission functions
- [ ] Add TypeScript types if using TypeScript
- [ ] Write tests for new policy

### 4. Update Application Code

- [ ] Replace permission check calls
- [ ] Update middleware/guards
- [ ] Update API endpoints
- [ ] Update frontend permission checks

### 5. Testing

- [ ] Write comprehensive tests
- [ ] Test edge cases
- [ ] Test with multiple roles
- [ ] Test dynamic permissions

### 6. Deployment

- [ ] Deploy to staging environment
- [ ] Run integration tests
- [ ] Deploy to production
- [ ] Monitor for issues

## 🔧 Migration Tools

### Policy Converter Script

Here's a script to help convert your existing policies:

```typescript
interface LegacyPermission {
  role: string;
  resource: string;
  actions: string[];
  conditions?: any;
}

function convertLegacyPolicy(permissions: LegacyPermission[]): string {
  const builder = new PolicyBuilder();
  
  // Group permissions by role
  const roleGroups = permissions.reduce((acc, perm) => {
    if (!acc[perm.role]) acc[perm.role] = [];
    acc[perm.role].push(perm);
    return acc;
  }, {} as Record<string, LegacyPermission[]>);
  
  // Convert each role
  for (const [role, rolePermissions] of Object.entries(roleGroups)) {
    const roleBuilder = builder.forRole(role);
    
    // Group by resource
    const resourceGroups = rolePermissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) acc[perm.resource] = [];
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, LegacyPermission[]>);
    
    // Convert each resource
    for (const [resource, resourcePermissions] of Object.entries(resourceGroups)) {
      const actions: Record<string, any> = {};
      
      for (const perm of resourcePermissions) {
        for (const action of perm.actions) {
          if (perm.conditions) {
            // Convert conditions to function
            actions[action] = `(user, resource) => { /* Convert conditions */ }`;
          } else {
            actions[action] = true;
          }
        }
      }
      
      roleBuilder.onResource(resource).can(actions);
    }
  }
  
  return builder.build();
}
```

### Testing Migration

Here's a test to verify your migration:

```typescript
describe('Migration Test', () => {
  test('new policy matches old policy behavior', () => {
    const testCases = [
      {
        user: { id: '123', roles: ['user'] },
        resource: 'article',
        action: 'read',
        data: { authorId: '123' },
        expected: true
      },
      {
        user: { id: '123', roles: ['user'] },
        resource: 'article',
        action: 'read',
        data: { authorId: '456' },
        expected: false
      }
    ];
    
    for (const testCase of testCases) {
      const oldResult = oldAccessControl.can(testCase.user, testCase.resource, testCase.action);
      const newResult = newGuardian.hasPermission(testCase.user, testCase.resource, testCase.action, testCase.data);
      
      expect(newResult).toBe(testCase.expected);
    }
  });
});
```

## 🚨 Common Migration Issues

### Issue 1: Role Inheritance

**Problem**: Old system had role inheritance, new system doesn't.

**Solution**: Explicitly grant permissions to all roles:

```typescript
// Old system with inheritance
ac.grant('admin').extend('user');

// New system without inheritance
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({ read: true })
  .forRole('admin')
  .onResource('article')
  .can({ 
    read: true,    // Explicitly grant user permissions
    write: true,   // Plus admin-specific permissions
    delete: true
  })
  .build();
```

### Issue 2: Dynamic Conditions

**Problem**: Old system used string-based conditions, new system uses functions.

**Solution**: Convert string conditions to JavaScript functions:

```typescript
// Old system
ac.grant('user').readOwn('article', { authorId: { $eq: 'user.id' } });

// New system
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user, article) => user.id === article.authorId
  })
  .build();
```

### Issue 3: Multiple Resources

**Problem**: Old system had different permission models for different resources.

**Solution**: Define separate policies for each resource type:

```typescript
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user, article) => user.id === article.authorId,
    update: (user, article) => user.id === article.authorId
  })
  .onResource('comment')
  .can({
    read: true,
    create: true,
    update: (user, comment) => user.id === comment.authorId
  })
  .build();
```

---

*With this migration guide, you should be able to successfully migrate from any access control system to Drakonis Guard.* 🐉
