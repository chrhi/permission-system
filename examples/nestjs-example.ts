// NestJS Integration Example
// This file demonstrates how to use Drakonis Guard with NestJS

import { AccessControl, PolicyBuilder } from '../src';

// 1. Define your types
interface User {
  id: string;
  roles: string[];
  email: string;
  isActive: boolean;
}

interface Article {
  id: string;
  authorId: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
}

// 2. Create your policy
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

// 3. Create access control instance
const accessControl = new AccessControl<User>(policy);

// 4. Simple permission guard
class PermissionGuard {
  canActivate(user: User, resource: string, action: string, data?: any): boolean {
    return accessControl.hasPermission(user, resource, action, data);
  }
}

// 5. Permission decorator
function Permission(resource: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // In a real NestJS app, you'd use SetMetadata here
    descriptor.value.permission = { resource, action };
  };
}

// 6. Controller with permissions
@Controller('articles')
export class ArticlesController {
  private permissionGuard = new PermissionGuard();

  @Post()
  @Permission('article', 'create')
  async createArticle(@Body() createArticleDto: any, user: User) {
    // Only users with 'create' permission on 'article' can access this
    if (!this.permissionGuard.canActivate(user, 'article', 'create')) {
      throw new Error('Insufficient permissions');
    }
    
    return { 
      message: 'Article created', 
      author: user.id,
      article: createArticleDto 
    };
  }

  @Get(':id')
  @Permission('article', 'read')
  async getArticle(@Param('id') id: string, user: User) {
    // Mock article data
    const article: Article = {
      id,
      authorId: 'author123',
      title: 'Sample Article',
      content: 'This is a sample article',
      status: 'published',
      createdAt: new Date()
    };

    // Check permission with article data
    if (!this.permissionGuard.canActivate(user, 'article', 'read', article)) {
      throw new Error('Insufficient permissions');
    }

    return article;
  }

  @Put(':id')
  @Permission('article', 'update')
  async updateArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: any,
    user: User
  ) {
    // Mock article data
    const article: Article = {
      id,
      authorId: user.id, // User owns this article
      title: 'Sample Article',
      content: 'This is a sample article',
      status: 'draft',
      createdAt: new Date()
    };

    // Check permission with article data
    if (!this.permissionGuard.canActivate(user, 'article', 'update', article)) {
      throw new Error('Insufficient permissions');
    }

    return { 
      message: 'Article updated', 
      id,
      updates: updateArticleDto 
    };
  }

  @Delete(':id')
  @Permission('article', 'delete')
  async deleteArticle(@Param('id') id: string, user: User) {
    // Mock article data
    const article: Article = {
      id,
      authorId: user.id, // User owns this article
      title: 'Sample Article',
      content: 'This is a sample article',
      status: 'draft', // Can only delete drafts
      createdAt: new Date()
    };

    // Check permission with article data
    if (!this.permissionGuard.canActivate(user, 'article', 'delete', article)) {
      throw new Error('Insufficient permissions');
    }

    return { message: 'Article deleted', id };
  }
}

// 7. Usage examples
function demonstrateUsage() {
  // Create some test users
  const admin: User = {
    id: 'admin123',
    roles: ['admin'],
    email: 'admin@example.com',
    isActive: true
  };

  const author: User = {
    id: 'author123',
    roles: ['author'],
    email: 'author@example.com',
    isActive: true
  };

  const reader: User = {
    id: 'reader123',
    roles: ['reader'],
    email: 'reader@example.com',
    isActive: true
  };

  // Test article
  const article: Article = {
    id: 'article456',
    authorId: 'author123',
    title: 'My Article',
    content: 'This is my article content',
    status: 'draft',
    createdAt: new Date()
  };

  console.log('=== Permission Tests ===');
  
  // Admin can do everything
  console.log('Admin can create:', accessControl.hasPermission(admin, 'article', 'create'));
  console.log('Admin can read:', accessControl.hasPermission(admin, 'article', 'read', article));
  console.log('Admin can update:', accessControl.hasPermission(admin, 'article', 'update', article));
  console.log('Admin can delete:', accessControl.hasPermission(admin, 'article', 'delete', article));

  // Author can manage their own articles
  console.log('Author can create:', accessControl.hasPermission(author, 'article', 'create'));
  console.log('Author can read own article:', accessControl.hasPermission(author, 'article', 'read', article));
  console.log('Author can update own article:', accessControl.hasPermission(author, 'article', 'update', article));
  console.log('Author can delete own draft:', accessControl.hasPermission(author, 'article', 'delete', article));

  // Reader can only read published articles
  console.log('Reader can read draft:', accessControl.hasPermission(reader, 'article', 'read', article));
  
  // Published article
  const publishedArticle = { ...article, status: 'published' as const };
  console.log('Reader can read published:', accessControl.hasPermission(reader, 'article', 'read', publishedArticle));
}

// Run demonstration
demonstrateUsage();

export { ArticlesController, policy, accessControl };
