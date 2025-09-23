# 📚 Drakonis Guard Documentation

Welcome to the complete documentation for **Drakonis Guard** - your mythical access control system.

## 🚀 Quick Links

- **[Quick Start Guide](./quick-start.md)** - Get up and running in 5 minutes
- **[API Reference](./api-reference.md)** - Complete API documentation
- **[Examples](./examples.md)** - Real-world usage examples
- **[Best Practices](./best-practices.md)** - Recommended patterns and tips
- **[Migration Guide](./migration.md)** - Migrate from other libraries
- **[NestJS Integration](./nestjs-integration.md)** - Complete NestJS integration guide

## 🎯 What You'll Learn

This documentation will teach you how to:

- ✅ **Set up** Drakonis Guard in your project
- ✅ **Define** flexible permission policies
- ✅ **Implement** role-based access control
- ✅ **Handle** dynamic permission checks
- ✅ **Use** TypeScript for type safety
- ✅ **Test** your permission system
- ✅ **Migrate** from other libraries

## 📖 Documentation Structure

### 🚀 [Quick Start Guide](./quick-start.md)
Perfect for beginners! Learn the basics and get your first policy working in minutes.

### 📚 [API Reference](./api-reference.md)
Complete reference for all classes, methods, and types. Use this as your go-to reference.

### 🎯 [Examples](./examples.md)
Real-world examples including blog platforms, e-commerce stores, and multi-tenant SaaS applications.

### 🏛️ [Best Practices](./best-practices.md)
Learn recommended patterns, security considerations, and performance optimization tips.

### 🔄 [Migration Guide](./migration.md)
Step-by-step guide for migrating from other access control libraries like AccessControl or CASL.

## 🎨 Example Usage

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

// Define your policy
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ create: true, read: true, update: true, delete: true })
  .forRole('author')
  .onResource('article')
  .can({
    create: true,
    read: (user, article) => user.id === article.authorId || article.status === 'published',
    update: (user, article) => user.id === article.authorId,
    delete: (user, article) => user.id === article.authorId && article.status === 'draft'
  })
  .build();

// Create access control instance
const guardian = new AccessControl(policy);

// Check permissions
const user = { id: '123', roles: ['author'] };
const article = { id: '456', authorId: '123', status: 'draft' };

guardian.hasPermission(user, 'article', 'update', article); // true
guardian.hasPermission(user, 'article', 'delete', article); // true
```

## 🆘 Need Help?

- **Issues**: [GitHub Issues](https://github.com/yourusername/drakonis-guard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/drakonis-guard/discussions)
- **Documentation**: This folder contains all the guides you need

---

*"Beware the guardian's gaze - for it sees all, permits only what is right."* 🐉

**Ready to start?** → [Quick Start Guide](./quick-start.md)
