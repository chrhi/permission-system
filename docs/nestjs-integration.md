# 🚀 NestJS Integration Guide

Complete guide for integrating Drakonis Guard with NestJS applications.

## 📦 Installation

```bash
npm install drakonis-guard
```

## 🎯 Basic Integration

### 1. Create a Policy Module

```typescript
// src/auth/policy.module.ts
import { Module } from '@nestjs/common';
import { AccessControl, PolicyBuilder } from 'drakonis-guard';

export interface User {
  id: string;
  roles: string[];
  email: string;
  isActive: boolean;
}

export interface Article {
  id: string;
  authorId: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
}

@Module({
  providers: [
    {
      provide: 'ACCESS_CONTROL',
      useFactory: () => {
        const policy = new PolicyBuilder<User>()
          .forRole('admin')
          .onResource<Article>('article')
          .can({
            create: true,
            read: true,
            update: true,
            delete: true,
            publish: true,
            archive: true
          })
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
              return article.authorId === user.id && article.status === 'draft';
            }
          })
          .forRole('reader')
          .onResource<Article>('article')
          .can({
            read: (user, article) => article.status === 'published'
          })
          .build();

        return new AccessControl<User>(policy);
      }
    }
  ],
  exports: ['ACCESS_CONTROL']
})
export class PolicyModule {}
```

### 2. Create a Permission Guard

```typescript
// src/auth/permission.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControl } from 'drakonis-guard';
import { User } from './policy.module';

export interface PermissionMetadata {
  resource: string;
  action: string;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly accessControl: AccessControl<User>,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<PermissionMetadata>(
      'permission',
      context.getHandler()
    );

    if (!permission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;
    const resourceData = request.body || request.params;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasPermission = this.accessControl.hasPermission(
      user,
      permission.resource,
      permission.action,
      resourceData
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${permission.action} on ${permission.resource}`
      );
    }

    return true;
  }
}
```

### 3. Create Permission Decorator

```typescript
// src/auth/permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface PermissionMetadata {
  resource: string;
  action: string;
}

export const Permission = (resource: string, action: string) =>
  SetMetadata('permission', { resource, action });
```

### 4. Use in Controllers

```typescript
// src/articles/articles.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PermissionGuard } from '../auth/permission.guard';
import { Permission } from '../auth/permission.decorator';
import { User } from '../auth/policy.module';

@Controller('articles')
@UseGuards(PermissionGuard)
export class ArticlesController {
  
  @Post()
  @Permission('article', 'create')
  async createArticle(@Body() createArticleDto: any, @User() user: User) {
    // Only users with 'create' permission on 'article' can access this
    return { message: 'Article created', user: user.id };
  }

  @Get(':id')
  @Permission('article', 'read')
  async getArticle(@Param('id') id: string, @User() user: User) {
    // Only users with 'read' permission on 'article' can access this
    return { id, message: 'Article retrieved' };
  }

  @Put(':id')
  @Permission('article', 'update')
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: any,
    @User() user: User
  ) {
    // Only users with 'update' permission on 'article' can access this
    return { id, message: 'Article updated' };
  }

  @Delete(':id')
  @Permission('article', 'delete')
  async deleteArticle(@Param('id') id: string, @User() user: User) {
    // Only users with 'delete' permission on 'article' can access this
    return { id, message: 'Article deleted' };
  }
}
```

## 🔧 Advanced Integration

### Custom User Decorator

```typescript
// src/auth/user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  }
);
```

### Resource-based Permissions

```typescript
// src/articles/articles.controller.ts
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { PermissionGuard } from '../auth/permission.guard';
import { Permission } from '../auth/permission.decorator';

@Controller('articles')
@UseGuards(PermissionGuard)
export class ArticlesController {
  
  @Get(':id')
  @Permission('article', 'read')
  async getArticle(@Param('id') id: string, @Req() req: any) {
    // The permission check will include the article data
    const article = await this.articlesService.findById(id);
    return article;
  }

  @Put(':id')
  @Permission('article', 'update')
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: any,
    @Req() req: any
  ) {
    // The permission check will include the article data
    const article = await this.articlesService.findById(id);
    req.article = article; // Make article available for permission check
    return this.articlesService.update(id, updateArticleDto);
  }
}
```

### Dynamic Permission Guard

```typescript
// src/auth/dynamic-permission.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControl } from 'drakonis-guard';
import { User } from './policy.module';

export interface DynamicPermissionMetadata {
  resource: string;
  action: string;
  getResourceData?: (request: any) => any;
}

@Injectable()
export class DynamicPermissionGuard implements CanActivate {
  constructor(
    private readonly accessControl: AccessControl<User>,
    private readonly reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.get<DynamicPermissionMetadata>(
      'dynamic-permission',
      context.getHandler()
    );

    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get resource data dynamically
    const resourceData = permission.getResourceData 
      ? permission.getResourceData(request)
      : request.body || request.params;

    const hasPermission = this.accessControl.hasPermission(
      user,
      permission.resource,
      permission.action,
      resourceData
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${permission.action} on ${permission.resource}`
      );
    }

    return true;
  }
}
```

### Dynamic Permission Decorator

```typescript
// src/auth/dynamic-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';

export interface DynamicPermissionMetadata {
  resource: string;
  action: string;
  getResourceData?: (request: any) => any;
}

export const DynamicPermission = (
  resource: string,
  action: string,
  getResourceData?: (request: any) => any
) => SetMetadata('dynamic-permission', { resource, action, getResourceData });
```

### Usage with Dynamic Permissions

```typescript
// src/articles/articles.controller.ts
import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { DynamicPermissionGuard } from '../auth/dynamic-permission.guard';
import { DynamicPermission } from '../auth/dynamic-permission.decorator';

@Controller('articles')
@UseGuards(DynamicPermissionGuard)
export class ArticlesController {
  
  @Get(':id')
  @DynamicPermission('article', 'read', (req) => {
    // Return the article data for permission check
    return req.article;
  })
  async getArticle(@Param('id') id: string, @Req() req: any) {
    const article = await this.articlesService.findById(id);
    req.article = article; // Set article for permission check
    return article;
  }
}
```

## 🏗️ Module Structure

### Complete Auth Module

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PolicyModule } from './policy.module';
import { PermissionGuard } from './permission.guard';
import { DynamicPermissionGuard } from './dynamic-permission.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' }
    }),
    PolicyModule
  ],
  providers: [
    PermissionGuard,
    DynamicPermissionGuard
  ],
  exports: [
    PermissionGuard,
    DynamicPermissionGuard,
    PolicyModule
  ]
})
export class AuthModule {}
```

### App Module Integration

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  imports: [
    AuthModule,
    ArticlesModule
  ]
})
export class AppModule {}
```

## 🧪 Testing

### Unit Tests

```typescript
// src/auth/permission.guard.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from './permission.guard';
import { AccessControl } from 'drakonis-guard';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let accessControl: AccessControl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionGuard,
        {
          provide: 'ACCESS_CONTROL',
          useValue: {
            hasPermission: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<PermissionGuard>(PermissionGuard);
    accessControl = module.get<AccessControl>('ACCESS_CONTROL');
  });

  it('should allow access when user has permission', () => {
    const mockUser = { id: '123', roles: ['admin'] };
    const mockRequest = { user: mockUser };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: () => ({ resource: 'article', action: 'read' })
    } as ExecutionContext;

    jest.spyOn(accessControl, 'hasPermission').mockReturnValue(true);

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should deny access when user lacks permission', () => {
    const mockUser = { id: '123', roles: ['user'] };
    const mockRequest = { user: mockUser };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: () => ({ resource: 'article', action: 'delete' })
    } as ExecutionContext;

    jest.spyOn(accessControl, 'hasPermission').mockReturnValue(false);

    expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
  });
});
```

### Integration Tests

```typescript
// src/articles/articles.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PermissionGuard } from '../auth/permission.guard';

describe('ArticlesController', () => {
  let controller: ArticlesController;
  let service: ArticlesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    })
    .overrideGuard(PermissionGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<ArticlesController>(ArticlesController);
    service = module.get<ArticlesService>(ArticlesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create article', async () => {
    const createArticleDto = { title: 'Test Article', content: 'Test Content' };
    const user = { id: '123', roles: ['author'] };

    jest.spyOn(service, 'create').mockResolvedValue({ id: '456', ...createArticleDto });

    const result = await controller.createArticle(createArticleDto, user);
    expect(result).toBeDefined();
    expect(service.create).toHaveBeenCalledWith(createArticleDto);
  });
});
```

## 🚀 Production Considerations

### Environment-based Policies

```typescript
// src/auth/policy.factory.ts
import { PolicyBuilder } from 'drakonis-guard';
import { User } from './policy.module';

export function createPolicy(): any {
  const builder = new PolicyBuilder<User>();

  // Add policies based on environment
  if (process.env.NODE_ENV === 'development') {
    // More permissive policies for development
    builder.forRole('developer').onResource('*').can({ '*': true });
  }

  // Production policies
  builder
    .forRole('admin')
    .onResource('article')
    .can({
      create: true,
      read: true,
      update: true,
      delete: true
    });

  return builder.build();
}
```

### Caching Permissions

```typescript
// src/auth/cached-permission.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { CachingAccessControl } from './caching-access-control';

@Injectable()
export class CachedPermissionGuard implements CanActivate {
  constructor(private readonly accessControl: CachingAccessControl) {}

  canActivate(context: ExecutionContext): boolean {
    // Implementation with caching
    return true;
  }
}
```

---

*Drakonis Guard integrates seamlessly with NestJS, providing powerful access control for your applications.* 🐉
