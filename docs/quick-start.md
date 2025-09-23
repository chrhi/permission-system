# 🚀 Quick Start Guide

Get up and running with Drakonis Guard in just a few minutes!

## 📦 Installation

```bash
npm install drakonis-guard
```

## 🎯 Basic Usage

### Step 1: Import the Library

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';
```

### Step 2: Define Your Policy

Create a policy using the fluent builder pattern:

```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({
    create: true,
    read: true,
    update: true,
    delete: true
  })
  .forRole('author')
  .onResource('article')
  .can({
    create: true,
    read: true,
    update: (user, article) => user.id === article.authorId,
    delete: (user, article) => user.id === article.authorId
  })
  .build();
```

### Step 3: Create Access Control Instance

```typescript
const guardian = new AccessControl(policy);
```

### Step 4: Check Permissions

```typescript
const user = { id: '123', roles: ['author'] };
const article = { id: '456', authorId: '123', content: 'Hello World' };

// Check if user can edit the article
const canEdit = guardian.hasPermission(user, 'article', 'update', article);
console.log(canEdit); // true (because user.id === article.authorId)

// Check if user can delete the article
const canDelete = guardian.hasPermission(user, 'article', 'delete', article);
console.log(canDelete); // true (because user.id === article.authorId)
```

## 🎭 Working with Multiple Roles

Users can have multiple roles, and permissions are checked across all roles:

```typescript
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ '*': true }) // Admin can do everything
  
  .forRole('moderator')
  .onResource('article')
  .can({
    read: true,
    update: true // Can update any article
  })
  
  .forRole('author')
  .onResource('article')
  .can({
    create: true,
    read: true,
    update: (user, article) => user.id === article.authorId
  })
  .build();

const guardian = new AccessControl(policy);

// User with multiple roles
const user = { 
  id: '123', 
  roles: ['author', 'moderator'] 
};

const article = { id: '456', authorId: '999', content: 'Hello World' };

// This will return true because user has 'moderator' role
guardian.hasPermission(user, 'article', 'update', article); // true
```

## 🔮 Dynamic Permission Checks

Use functions for complex, context-aware permissions:

```typescript
const policy = new PolicyBuilder()
  .forRole('user')
  .onResource('document')
  .can({
    read: (user, document) => {
      // Can read if document is public or user owns it
      return document.isPublic || document.ownerId === user.id;
    },
    edit: (user, document) => {
      // Can edit only if user owns the document and it's not locked
      return document.ownerId === user.id && !document.isLocked;
    }
  })
  .build();
```

## 🏗️ TypeScript Support

Drakonis Guard provides full TypeScript support with generics:

```typescript
// Define your user type
type User = {
  id: string;
  roles: string[];
  department: string;
  clearanceLevel: number;
};

// Define your resource type
type Document = {
  id: string;
  ownerId: string;
  department: string;
  classification: 'public' | 'confidential' | 'secret';
  requiredClearance: number;
};

// Create typed policy builder
const policy = new PolicyBuilder<User>()
  .forRole('employee')
  .onResource<Document>('document')
  .can({
    read: (user, document) => {
      // TypeScript will provide autocomplete for user and document properties
      return user.clearanceLevel >= document.requiredClearance &&
             user.department === document.department;
    }
  })
  .build();

// Create typed access control
const guardian = new AccessControl<User>(policy);
```

## 🎨 Advanced Example: Blog Platform

Here's a more complete example for a blog platform:

```typescript
type BlogUser = {
  id: string;
  roles: string[];
  isPremium: boolean;
  reputation: number;
};

type Article = {
  id: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  createdAt: Date;
};

const blogPolicy = new PolicyBuilder<BlogUser>()
  // Admin can do everything
  .forRole('admin')
  .onResource<Article>('article')
  .can({ '*': true })
  
  // Authors can manage their own articles
  .forRole('author')
  .onResource<Article>('article')
  .can({
    create: true,
    read: (user, article) => {
      return article.authorId === user.id || article.status === 'published';
    },
    update: (user, article) => {
      return article.authorId === user.id && article.status !== 'archived';
    },
    delete: (user, article) => {
      return article.authorId === user.id && article.status === 'draft';
    },
    publish: (user, article) => {
      return article.authorId === user.id && 
             article.status === 'draft' && 
             user.isPremium;
    }
  })
  
  // Readers can only read published articles
  .forRole('reader')
  .onResource<Article>('article')
  .can({
    read: (user, article) => article.status === 'published'
  })
  
  // Moderators can moderate content
  .forRole('moderator')
  .onResource<Article>('article')
  .can({
    read: true,
    update: (user, article) => {
      return article.status === 'published' && user.reputation > 100;
    },
    archive: (user, article) => {
      return article.status === 'published' && user.reputation > 200;
    }
  })
  .build();

const blogGuardian = new AccessControl<BlogUser>(blogPolicy);

// Usage examples
const author: BlogUser = {
  id: 'author123',
  roles: ['author'],
  isPremium: true,
  reputation: 50
};

const article: Article = {
  id: 'article456',
  authorId: 'author123',
  status: 'draft',
  category: 'technology',
  createdAt: new Date()
};

// Check permissions
blogGuardian.hasPermission(author, 'article', 'publish', article); // true
blogGuardian.hasPermission(author, 'article', 'read', article); // true
```

## 🎯 Next Steps

- **[API Reference](./api-reference.md)** - Learn about all available methods and options
- **[Examples](./examples.md)** - Explore more complex use cases
- **[Best Practices](./best-practices.md)** - Learn recommended patterns and common pitfalls

---

*Ready to guard your application with mythical precision?* 🐉
