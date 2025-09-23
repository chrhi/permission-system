# 🐉 Drakonis Guard Documentation

Welcome to the comprehensive documentation for **Drakonis Guard** - a flexible, type-safe access control system for Node.js applications.

## 📚 Table of Contents

- [Quick Start Guide](./quick-start.md) - Get up and running in minutes
- [API Reference](./api-reference.md) - Complete API documentation
- [Examples](./examples.md) - Real-world usage examples
- [Best Practices](./best-practices.md) - Recommended patterns and tips
- [Migration Guide](./migration.md) - Upgrading from other libraries
- [NestJS Integration](./nestjs-integration.md) - Complete NestJS integration guide

## 🚀 What is Drakonis Guard?

Drakonis Guard is a powerful, flexible access control system that allows you to:

- **Define complex permission rules** using a fluent, builder pattern
- **Support multiple roles** per user with automatic permission aggregation
- **Use dynamic conditions** with function-based permission checks
- **Maintain type safety** with full TypeScript support
- **Scale easily** with a simple, intuitive API

## 🎯 Key Features

- ✅ **Type-Safe**: Full TypeScript support with generics
- ✅ **Flexible**: Support for boolean and function-based permissions
- ✅ **Multi-Role**: Users can have multiple roles
- ✅ **Dynamic**: Context-aware permission evaluation
- ✅ **Lightweight**: Zero external dependencies
- ✅ **ESM Ready**: Modern ES modules support

## 📖 Quick Example

```typescript
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

// Define your policy
const policy = new PolicyBuilder()
  .forRole('admin')
  .onResource('article')
  .can({ create: true, delete: true })
  .forRole('author')
  .onResource('article')
  .can({
    create: true,
    edit: (user, article) => user.id === article.authorId,
    delete: (user, article) => user.id === article.authorId
  })
  .build();

// Create access control instance
const guardian = new AccessControl(policy);

// Check permissions
const user = { id: '123', roles: ['author'] };
const article = { id: '456', authorId: '123', content: 'Hello World' };

guardian.hasPermission(user, 'article', 'edit', article); // true
guardian.hasPermission(user, 'article', 'delete', article); // true
```

## 🔗 Navigation

- **[Quick Start Guide](./quick-start.md)** - Start here for a step-by-step tutorial
- **[API Reference](./api-reference.md)** - Complete documentation of all classes and methods
- **[Examples](./examples.md)** - Browse real-world examples and use cases
- **[Best Practices](./best-practices.md)** - Learn recommended patterns and common pitfalls
- **[Migration Guide](./migration.md)** - Migrate from other access control libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/drakonis-guard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/drakonis-guard/discussions)
- **Documentation**: This folder contains all the guides you need

---

*"Beware the guardian's gaze - for it sees all, permits only what is right."* 🐉
