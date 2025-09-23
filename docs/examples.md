# 🎯 Examples

Real-world examples and use cases for Drakonis Guard.

## 📝 Table of Contents

- [Blog Platform](#blog-platform)
- [E-commerce Store](#e-commerce-store)
- [Document Management](#document-management)
- [Multi-tenant SaaS](#multi-tenant-saas)
- [API Gateway](#api-gateway)
- [Content Management](#content-management)

## 📝 Blog Platform

A complete blog platform with authors, editors, and readers.

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

type BlogUser = {
  id: string;
  roles: string[];
  isPremium: boolean;
  reputation: number;
  department?: string;
};

type Article = {
  id: string;
  authorId: string;
  status: 'draft' | 'published' | 'archived';
  category: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
};

type Comment = {
  id: string;
  articleId: string;
  authorId: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
};

const blogPolicy = new PolicyBuilder<BlogUser>()
  // Super Admin - can do everything
  .forRole('super-admin')
  .onResource('*')
  .can({ '*': true })
  
  // Admin - can manage all content
  .forRole('admin')
  .onResource<Article>('article')
  .can({
    read: true,
    create: true,
    update: true,
    delete: true,
    publish: true,
    archive: true
  })
  .onResource<Comment>('comment')
  .can({
    read: true,
    create: true,
    update: true,
    delete: true,
    approve: true,
    reject: true
  })
  
  // Editor - can manage content in their department
  .forRole('editor')
  .onResource<Article>('article')
  .can({
    read: (user, article) => {
      return article.status === 'published' || 
             article.department === user.department ||
             article.authorId === user.id;
    },
    create: true,
    update: (user, article) => {
      return article.department === user.department ||
             article.authorId === user.id;
    },
    publish: (user, article) => {
      return article.department === user.department &&
             article.status === 'draft';
    },
    archive: (user, article) => {
      return article.department === user.department &&
             article.status === 'published';
    }
  })
  .onResource<Comment>('comment')
  .can({
    read: true,
    approve: (user, comment) => {
      // Can approve comments on articles in their department
      return comment.article?.department === user.department;
    },
    reject: (user, comment) => {
      return comment.article?.department === user.department;
    }
  })
  
  // Author - can manage their own content
  .forRole('author')
  .onResource<Article>('article')
  .can({
    read: (user, article) => {
      return article.authorId === user.id || article.status === 'published';
    },
    create: true,
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
  .onResource<Comment>('comment')
  .can({
    read: true,
    create: true,
    update: (user, comment) => {
      return comment.authorId === user.id;
    },
    delete: (user, comment) => {
      return comment.authorId === user.id;
    }
  })
  
  // Reader - can only read published content
  .forRole('reader')
  .onResource<Article>('article')
  .can({
    read: (user, article) => article.status === 'published'
  })
  .onResource<Comment>('comment')
  .can({
    read: (user, comment) => comment.status === 'approved'
  })
  .build();

const blogGuardian = new AccessControl<BlogUser>(blogPolicy);

// Usage examples
const author: BlogUser = {
  id: 'author123',
  roles: ['author'],
  isPremium: true,
  reputation: 50,
  department: 'tech'
};

const article: Article = {
  id: 'article456',
  authorId: 'author123',
  status: 'draft',
  category: 'technology',
  department: 'tech',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Check permissions
console.log(blogGuardian.hasPermission(author, 'article', 'publish', article)); // true
console.log(blogGuardian.hasPermission(author, 'article', 'read', article)); // true
```

## 🛒 E-commerce Store

An e-commerce platform with customers, sellers, and administrators.

```typescript
type EcommerceUser = {
  id: string;
  roles: string[];
  isVerified: boolean;
  subscriptionLevel: 'basic' | 'premium' | 'enterprise';
  sellerRating?: number;
};

type Product = {
  id: string;
  sellerId: string;
  name: string;
  price: number;
  status: 'active' | 'inactive' | 'suspended';
  category: string;
  inventory: number;
};

type Order = {
  id: string;
  customerId: string;
  sellerId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: Date;
};

const ecommercePolicy = new PolicyBuilder<EcommerceUser>()
  // Platform Admin
  .forRole('platform-admin')
  .onResource('*')
  .can({ '*': true })
  
  // Seller Admin - manages their store
  .forRole('seller-admin')
  .onResource<Product>('product')
  .can({
    read: (user, product) => product.sellerId === user.id,
    create: true,
    update: (user, product) => product.sellerId === user.id,
    delete: (user, product) => product.sellerId === user.id && product.status !== 'suspended'
  })
  .onResource<Order>('order')
  .can({
    read: (user, order) => order.sellerId === user.id,
    update: (user, order) => {
      return order.sellerId === user.id && 
             ['pending', 'confirmed'].includes(order.status);
    }
  })
  
  // Seller - can manage products and orders
  .forRole('seller')
  .onResource<Product>('product')
  .can({
    read: (user, product) => product.sellerId === user.id,
    create: user.isVerified,
    update: (user, product) => {
      return product.sellerId === user.id && 
             user.subscriptionLevel !== 'basic';
    },
    delete: (user, product) => {
      return product.sellerId === user.id && 
             product.inventory === 0 &&
             user.subscriptionLevel !== 'basic';
    }
  })
  .onResource<Order>('order')
  .can({
    read: (user, order) => order.sellerId === user.id,
    update: (user, order) => {
      return order.sellerId === user.id && 
             order.status === 'pending' &&
             user.isVerified;
    }
  })
  
  // Customer - can browse and purchase
  .forRole('customer')
  .onResource<Product>('product')
  .can({
    read: (user, product) => product.status === 'active'
  })
  .onResource<Order>('order')
  .can({
    read: (user, order) => order.customerId === user.id,
    create: true,
    update: (user, order) => {
      return order.customerId === user.id && 
             order.status === 'pending';
    },
    cancel: (user, order) => {
      return order.customerId === user.id && 
             ['pending', 'confirmed'].includes(order.status);
    }
  })
  .build();

const ecommerceGuardian = new AccessControl<EcommerceUser>(ecommercePolicy);
```

## 📄 Document Management

A document management system with hierarchical permissions.

```typescript
type DocUser = {
  id: string;
  roles: string[];
  department: string;
  clearanceLevel: number;
  isActive: boolean;
};

type Document = {
  id: string;
  ownerId: string;
  department: string;
  classification: 'public' | 'internal' | 'confidential' | 'secret';
  requiredClearance: number;
  status: 'draft' | 'review' | 'approved' | 'archived';
  parentFolderId?: string;
};

type Folder = {
  id: string;
  ownerId: string;
  department: string;
  classification: 'public' | 'internal' | 'confidential' | 'secret';
  requiredClearance: number;
};

const docPolicy = new PolicyBuilder<DocUser>()
  // System Admin
  .forRole('system-admin')
  .onResource('*')
  .can({ '*': true })
  
  // Department Head
  .forRole('dept-head')
  .onResource<Document>('document')
  .can({
    read: (user, doc) => {
      return doc.department === user.department &&
             user.clearanceLevel >= doc.requiredClearance;
    },
    create: (user, doc) => {
      return doc.department === user.department &&
             user.clearanceLevel >= doc.requiredClearance;
    },
    update: (user, doc) => {
      return doc.department === user.department &&
             user.clearanceLevel >= doc.requiredClearance &&
             doc.status !== 'archived';
    },
    approve: (user, doc) => {
      return doc.department === user.department &&
             doc.status === 'review' &&
             user.clearanceLevel >= doc.requiredClearance;
    },
    archive: (user, doc) => {
      return doc.department === user.department &&
             doc.status === 'approved';
    }
  })
  .onResource<Folder>('folder')
  .can({
    read: (user, folder) => {
      return folder.department === user.department &&
             user.clearanceLevel >= folder.requiredClearance;
    },
    create: (user, folder) => {
      return folder.department === user.department &&
             user.clearanceLevel >= folder.requiredClearance;
    },
    update: (user, folder) => {
      return folder.department === user.department &&
             user.clearanceLevel >= folder.requiredClearance;
    }
  })
  
  // Employee
  .forRole('employee')
  .onResource<Document>('document')
  .can({
    read: (user, doc) => {
      return doc.department === user.department &&
             user.clearanceLevel >= doc.requiredClearance &&
             doc.status !== 'draft';
    },
    create: (user, doc) => {
      return doc.department === user.department &&
             user.clearanceLevel >= doc.requiredClearance;
    },
    update: (user, doc) => {
      return doc.ownerId === user.id &&
             doc.status === 'draft' &&
             user.clearanceLevel >= doc.requiredClearance;
    }
  })
  .onResource<Folder>('folder')
  .can({
    read: (user, folder) => {
      return folder.department === user.department &&
             user.clearanceLevel >= folder.requiredClearance;
    }
  })
  .build();

const docGuardian = new AccessControl<DocUser>(docPolicy);
```

## 🏢 Multi-tenant SaaS

A multi-tenant SaaS application with organization-based isolation.

```typescript
type SaaSUser = {
  id: string;
  roles: string[];
  organizationId: string;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  isActive: boolean;
};

type Workspace = {
  id: string;
  organizationId: string;
  name: string;
  type: 'personal' | 'team' | 'organization';
  ownerId: string;
};

type Project = {
  id: string;
  workspaceId: string;
  organizationId: string;
  name: string;
  status: 'active' | 'archived';
  ownerId: string;
};

const saasPolicy = new PolicyBuilder<SaaSUser>()
  // Organization Owner
  .forRole('org-owner')
  .onResource<Workspace>('workspace')
  .can({
    read: (user, workspace) => workspace.organizationId === user.organizationId,
    create: true,
    update: (user, workspace) => workspace.organizationId === user.organizationId,
    delete: (user, workspace) => workspace.organizationId === user.organizationId
  })
  .onResource<Project>('project')
  .can({
    read: (user, project) => project.organizationId === user.organizationId,
    create: true,
    update: (user, project) => project.organizationId === user.organizationId,
    delete: (user, project) => project.organizationId === user.organizationId
  })
  
  // Team Admin
  .forRole('team-admin')
  .onResource<Workspace>('workspace')
  .can({
    read: (user, workspace) => {
      return workspace.organizationId === user.organizationId &&
             ['team', 'organization'].includes(workspace.type);
    },
    create: user.subscriptionTier !== 'free',
    update: (user, workspace) => {
      return workspace.organizationId === user.organizationId &&
             workspace.ownerId === user.id;
    }
  })
  .onResource<Project>('project')
  .can({
    read: (user, project) => project.organizationId === user.organizationId,
    create: user.subscriptionTier !== 'free',
    update: (user, project) => {
      return project.organizationId === user.organizationId &&
             project.ownerId === user.id;
    },
    delete: (user, project) => {
      return project.organizationId === user.organizationId &&
             project.ownerId === user.id &&
             project.status === 'active';
    }
  })
  
  // Team Member
  .forRole('team-member')
  .onResource<Workspace>('workspace')
  .can({
    read: (user, workspace) => workspace.organizationId === user.organizationId
  })
  .onResource<Project>('project')
  .can({
    read: (user, project) => project.organizationId === user.organizationId,
    create: user.subscriptionTier !== 'free',
    update: (user, project) => {
      return project.organizationId === user.organizationId &&
             project.ownerId === user.id;
    }
  })
  
  // Viewer
  .forRole('viewer')
  .onResource<Workspace>('workspace')
  .can({
    read: (user, workspace) => workspace.organizationId === user.organizationId
  })
  .onResource<Project>('project')
  .can({
    read: (user, project) => project.organizationId === user.organizationId
  })
  .build();

const saasGuardian = new AccessControl<SaaSUser>(saasPolicy);
```

## 🌐 API Gateway

An API gateway with rate limiting and access control.

```typescript
type APIUser = {
  id: string;
  roles: string[];
  apiKey: string;
  rateLimit: number;
  allowedEndpoints: string[];
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise';
};

type APIEndpoint = {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  requiresAuth: boolean;
  rateLimit: number;
  subscriptionRequired: string[];
};

const apiPolicy = new PolicyBuilder<APIUser>()
  // Enterprise User
  .forRole('enterprise-user')
  .onResource<APIEndpoint>('endpoint')
  .can({
    access: (user, endpoint) => {
      return user.subscriptionPlan === 'enterprise' &&
             user.allowedEndpoints.includes(endpoint.path);
    }
  })
  
  // Premium User
  .forRole('premium-user')
  .onResource<APIEndpoint>('endpoint')
  .can({
    access: (user, endpoint) => {
      return ['premium', 'enterprise'].includes(user.subscriptionPlan) &&
             user.allowedEndpoints.includes(endpoint.path) &&
             user.rateLimit >= endpoint.rateLimit;
    }
  })
  
  // Basic User
  .forRole('basic-user')
  .onResource<APIEndpoint>('endpoint')
  .can({
    access: (user, endpoint) => {
      return ['basic', 'premium', 'enterprise'].includes(user.subscriptionPlan) &&
             user.allowedEndpoints.includes(endpoint.path) &&
             user.rateLimit >= endpoint.rateLimit &&
             endpoint.method === 'GET'; // Only read access
    }
  })
  
  // Free User
  .forRole('free-user')
  .onResource<APIEndpoint>('endpoint')
  .can({
    access: (user, endpoint) => {
      return endpoint.path.startsWith('/public') &&
             endpoint.method === 'GET' &&
             user.rateLimit >= endpoint.rateLimit;
    }
  })
  .build();

const apiGuardian = new AccessControl<APIUser>(apiPolicy);
```

## 📰 Content Management

A content management system with workflow and approval processes.

```typescript
type CMSUser = {
  id: string;
  roles: string[];
  department: string;
  clearanceLevel: number;
  isActive: boolean;
};

type Content = {
  id: string;
  authorId: string;
  department: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  contentType: 'article' | 'video' | 'image' | 'document';
  requiresApproval: boolean;
  scheduledPublishDate?: Date;
};

const cmsPolicy = new PolicyBuilder<CMSUser>()
  // Content Manager
  .forRole('content-manager')
  .onResource<Content>('content')
  .can({
    read: true,
    create: true,
    update: (user, content) => {
      return content.department === user.department ||
             content.authorId === user.id;
    },
    approve: (user, content) => {
      return content.department === user.department &&
             content.status === 'review' &&
             content.requiresApproval;
    },
    publish: (user, content) => {
      return content.department === user.department &&
             content.status === 'approved';
    },
    archive: (user, content) => {
      return content.department === user.department &&
             content.status === 'published';
    }
  })
  
  // Content Creator
  .forRole('content-creator')
  .onResource<Content>('content')
  .can({
    read: (user, content) => {
      return content.authorId === user.id ||
             content.status === 'published';
    },
    create: true,
    update: (user, content) => {
      return content.authorId === user.id &&
             content.status === 'draft';
    },
    submit: (user, content) => {
      return content.authorId === user.id &&
             content.status === 'draft' &&
             content.requiresApproval;
    }
  })
  
  // Reviewer
  .forRole('reviewer')
  .onResource<Content>('content')
  .can({
    read: (user, content) => {
      return content.department === user.department &&
             content.status === 'review';
    },
    approve: (user, content) => {
      return content.department === user.department &&
             content.status === 'review' &&
             content.requiresApproval;
    },
    reject: (user, content) => {
      return content.department === user.department &&
             content.status === 'review';
    }
  })
  
  // Reader
  .forRole('reader')
  .onResource<Content>('content')
  .can({
    read: (user, content) => content.status === 'published'
  })
  .build();

const cmsGuardian = new AccessControl<CMSUser>(cmsPolicy);
```

---

*These examples demonstrate the flexibility and power of Drakonis Guard in real-world scenarios.* 🐉
