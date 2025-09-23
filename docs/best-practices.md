# 🏛️ Best Practices

Recommended patterns, tips, and common pitfalls when using Drakonis Guard.

## 📋 Table of Contents

- [Policy Design](#policy-design)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [TypeScript Usage](#typescript-usage)
- [Testing Strategies](#testing-strategies)
- [Common Pitfalls](#common-pitfalls)

## 🎯 Policy Design

### Start with a Default Deny Policy

Always start with a restrictive policy and explicitly grant permissions:

```typescript
// ❌ Bad: Permissive by default
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('*')
  .can({ '*': true }) // Too permissive
  .build();

// ✅ Good: Restrictive by default
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user, article) => article.status === 'published'
  })
  .build();
```

### Use Hierarchical Role Design

Design roles in a hierarchy from most restrictive to least restrictive:

```typescript
// ✅ Good: Clear hierarchy
const policy = new PolicyBuilder()
  // Most restrictive
  .forRole('guest')
  .onResource('article')
  .can({
    read: (user, article) => article.isPublic
  })
  
  // More permissions
  .forRole('user')
  .onResource('article')
  .can({
    read: true,
    create: true
  })
  
  // Even more permissions
  .forRole('moderator')
  .onResource('article')
  .can({
    read: true,
    create: true,
    update: true,
    moderate: true
  })
  
  // Most permissive
  .forRole('admin')
  .onResource('article')
  .can({ '*': true })
  .build();
```

### Group Related Permissions

Group related permissions together for better organization:

```typescript
// ✅ Good: Grouped by functionality
const policy = new PolicyBuilder()
  .forRole('author')
  .onResource('article')
  .can({
    // Content management
    create: true,
    read: (user, article) => article.authorId === user.id || article.status === 'published',
    update: (user, article) => article.authorId === user.id,
    delete: (user, article) => article.authorId === user.id && article.status === 'draft',
    
    // Publishing workflow
    submit: (user, article) => article.authorId === user.id && article.status === 'draft',
    publish: (user, article) => article.authorId === user.id && user.isPremium,
    
    // Analytics
    viewStats: (user, article) => article.authorId === user.id
  })
  .build();
```

## 🔒 Security Considerations

### Validate User Input

Always validate user input in permission functions:

```typescript
// ❌ Bad: No validation
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => user.id === article.authorId // No validation
  })
  .build();

// ✅ Good: With validation
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => {
      // Validate inputs
      if (!user?.id || !article?.authorId) return false;
      if (typeof user.id !== 'string' || typeof article.authorId !== 'string') return false;
      
      return user.id === article.authorId;
    }
  })
  .build();
```

### Use Explicit Permission Checks

Avoid wildcard permissions in production:

```typescript
// ❌ Bad: Too permissive
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('*')
  .can({ '*': true })
  .build();

// ✅ Good: Explicit permissions
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({
    read: true,
    create: true,
    update: true,
    delete: true,
    moderate: true
  })
  .onResource('user')
  .can({
    read: true,
    update: true,
    suspend: true
  })
  .build();
```

### Implement Audit Logging

Log permission checks for security auditing:

```typescript
class AuditingAccessControl<TUser = any> extends AccessControl<TUser> {
  public hasPermission(user: TUser, resource: string, action: string, data?: any): boolean {
    const result = super.hasPermission(user, resource, action, data);
    
    // Log the permission check
    console.log({
      timestamp: new Date().toISOString(),
      userId: (user as any).id,
      resource,
      action,
      result,
      userAgent: (user as any).userAgent
    });
    
    return result;
  }
}
```

## ⚡ Performance Optimization

### Cache Permission Results

For frequently checked permissions, consider caching:

```typescript
class CachingAccessControl<TUser = any> extends AccessControl<TUser> {
  private cache = new Map<string, boolean>();
  
  public hasPermission(user: TUser, resource: string, action: string, data?: any): boolean {
    const cacheKey = `${(user as any).id}-${resource}-${action}-${JSON.stringify(data)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const result = super.hasPermission(user, resource, action, data);
    this.cache.set(cacheKey, result);
    
    return result;
  }
  
  public clearCache(): void {
    this.cache.clear();
  }
}
```

### Optimize Permission Functions

Keep permission functions simple and fast:

```typescript
// ❌ Bad: Complex, slow function
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user, article) => {
      // Complex database query in permission check
      const userGroups = await database.getUserGroups(user.id);
      const articleGroups = await database.getArticleGroups(article.id);
      return userGroups.some(group => articleGroups.includes(group));
    }
  })
  .build();

// ✅ Good: Simple, fast function
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user, article) => {
      // Simple property check
      return article.isPublic || 
             article.authorId === user.id ||
             user.allowedGroups.includes(article.groupId);
    }
  })
  .build();
```

### Use Early Returns

Use early returns to avoid unnecessary computation:

```typescript
// ✅ Good: Early returns
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => {
      // Early return for invalid data
      if (!user?.id || !article?.authorId) return false;
      
      // Early return for non-authors
      if (user.id !== article.authorId) return false;
      
      // Early return for archived articles
      if (article.status === 'archived') return false;
      
      // Complex logic only if needed
      return user.isActive && article.isEditable;
    }
  })
  .build();
```

## 🎭 TypeScript Usage

### Use Generic Types

Leverage TypeScript generics for type safety:

```typescript
// ✅ Good: Typed policy builder
type User = {
  id: string;
  roles: string[];
  department: string;
  clearanceLevel: number;
};

type Document = {
  id: string;
  ownerId: string;
  department: string;
  classification: 'public' | 'confidential' | 'secret';
  requiredClearance: number;
};

const policy = new PolicyBuilder<User>()
  .forRole('employee')
  .onResource<Document>('document')
  .can({
    read: (user, document) => {
      // TypeScript provides autocomplete and type checking
      return user.clearanceLevel >= document.requiredClearance &&
             user.department === document.department;
    }
  })
  .build();
```

### Define Clear Interfaces

Define clear interfaces for your data structures:

```typescript
// ✅ Good: Clear interfaces
interface BlogUser {
  readonly id: string;
  readonly roles: readonly string[];
  readonly isPremium: boolean;
  readonly reputation: number;
}

interface Article {
  readonly id: string;
  readonly authorId: string;
  readonly status: 'draft' | 'published' | 'archived';
  readonly category: string;
  readonly createdAt: Date;
}

const policy = new PolicyBuilder<BlogUser>()
  .forRole('author')
  .onResource<Article>('article')
  .can({
    update: (user, article) => user.id === article.authorId
  })
  .build();
```

### Use Type Guards

Use type guards for runtime type checking:

```typescript
function isBlogUser(user: any): user is BlogUser {
  return user &&
         typeof user.id === 'string' &&
         Array.isArray(user.roles) &&
         typeof user.isPremium === 'boolean' &&
         typeof user.reputation === 'number';
}

const policy = new PolicyBuilder<BlogUser>()
  .forRole('author')
  .onResource<Article>('article')
  .can({
    update: (user, article) => {
      if (!isBlogUser(user)) return false;
      return user.id === article.authorId;
    }
  })
  .build();
```

## 🧪 Testing Strategies

### Test Permission Functions

Test permission functions thoroughly:

```typescript
describe('Article Permissions', () => {
  const policy = new PolicyBuilder<User>()
    .forRole('author')
    .onResource<Article>('article')
    .can({
      update: (user, article) => user.id === article.authorId
    })
    .build();
  
  const guardian = new AccessControl<User>(policy);
  
  test('author can update own article', () => {
    const user: User = { id: '123', roles: ['author'] };
    const article: Article = { id: '456', authorId: '123', status: 'draft' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(true);
  });
  
  test('author cannot update other article', () => {
    const user: User = { id: '123', roles: ['author'] };
    const article: Article = { id: '456', authorId: '789', status: 'draft' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(false);
  });
  
  test('handles missing data gracefully', () => {
    const user: User = { id: '123', roles: ['author'] };
    
    expect(guardian.hasPermission(user, 'article', 'update', null)).toBe(false);
    expect(guardian.hasPermission(user, 'article', 'update', undefined)).toBe(false);
  });
});
```

### Test Edge Cases

Test edge cases and error conditions:

```typescript
describe('Edge Cases', () => {
  test('handles user with no roles', () => {
    const user = { id: '123', roles: [] };
    const article = { id: '456', authorId: '123' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(false);
  });
  
  test('handles user with invalid roles', () => {
    const user = { id: '123', roles: ['nonexistent'] };
    const article = { id: '456', authorId: '123' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(false);
  });
  
  test('handles missing resource', () => {
    const user = { id: '123', roles: ['author'] };
    
    expect(guardian.hasPermission(user, 'nonexistent', 'update')).toBe(false);
  });
});
```

### Mock External Dependencies

Mock external dependencies in permission functions:

```typescript
// Mock external service
jest.mock('../services/userService', () => ({
  getUserGroups: jest.fn()
}));

describe('Permission with External Dependencies', () => {
  const mockGetUserGroups = getUserGroups as jest.MockedFunction<typeof getUserGroups>;
  
  beforeEach(() => {
    mockGetUserGroups.mockClear();
  });
  
  test('permission check with mocked service', async () => {
    mockGetUserGroups.mockResolvedValue(['group1', 'group2']);
    
    const user = { id: '123', roles: ['user'] };
    const resource = { id: '456', groups: ['group1'] };
    
    const result = guardian.hasPermission(user, 'resource', 'read', resource);
    expect(result).toBe(true);
    expect(mockGetUserGroups).toHaveBeenCalledWith('123');
  });
});
```

## ⚠️ Common Pitfalls

### Forgetting to Handle Undefined Data

Always handle cases where data might be undefined:

```typescript
// ❌ Bad: Will throw error if data is undefined
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => user.id === article.authorId // Error if article is undefined
  })
  .build();

// ✅ Good: Handles undefined data
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => {
      if (!article) return false;
      return user.id === article.authorId;
    }
  })
  .build();
```

### Not Validating User Roles

Always validate that users have the expected role structure:

```typescript
// ❌ Bad: Assumes user has roles property
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: true
  })
  .build();

// ✅ Good: Validates user structure
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    read: (user) => {
      if (!user || !Array.isArray(user.roles)) return false;
      return user.roles.includes('user');
    }
  })
  .build();
```

### Using Complex Logic in Permission Functions

Keep permission functions simple and focused:

```typescript
// ❌ Bad: Complex business logic in permission function
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => {
      // Complex business logic that should be elsewhere
      const userSubscription = getUserSubscription(user.id);
      const articleCategory = getArticleCategory(article.id);
      const userPreferences = getUserPreferences(user.id);
      
      if (userSubscription.isExpired) return false;
      if (articleCategory.requiresPremium && !userSubscription.isPremium) return false;
      if (userPreferences.blockedCategories.includes(articleCategory.id)) return false;
      
      return user.id === article.authorId;
    }
  })
  .build();

// ✅ Good: Simple permission check
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => {
      // Simple ownership check
      return user.id === article.authorId;
    }
  })
  .build();

// Business logic should be handled elsewhere
function canUserUpdateArticle(user: User, article: Article): boolean {
  // Check permission first
  if (!guardian.hasPermission(user, 'article', 'update', article)) {
    return false;
  }
  
  // Then check business rules
  const userSubscription = getUserSubscription(user.id);
  if (userSubscription.isExpired) return false;
  
  const articleCategory = getArticleCategory(article.id);
  if (articleCategory.requiresPremium && !userSubscription.isPremium) return false;
  
  return true;
}
```

### Not Testing Permission Functions

Always test your permission functions:

```typescript
// ❌ Bad: No tests for permission functions
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('article')
  .can({
    update: (user, article) => {
      // Complex logic without tests
      return user.id === article.authorId && 
             article.status !== 'archived' &&
             user.isActive;
    }
  })
  .build();

// ✅ Good: Tested permission functions
describe('Article Update Permission', () => {
  test('allows update for active user on own non-archived article', () => {
    const user = { id: '123', roles: ['user'], isActive: true };
    const article = { id: '456', authorId: '123', status: 'draft' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(true);
  });
  
  test('denies update for inactive user', () => {
    const user = { id: '123', roles: ['user'], isActive: false };
    const article = { id: '456', authorId: '123', status: 'draft' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(false);
  });
  
  test('denies update for archived article', () => {
    const user = { id: '123', roles: ['user'], isActive: true };
    const article = { id: '456', authorId: '123', status: 'archived' };
    
    expect(guardian.hasPermission(user, 'article', 'update', article)).toBe(false);
  });
});
```

---

*Following these best practices will help you build secure, maintainable, and performant access control systems.* 🐉
