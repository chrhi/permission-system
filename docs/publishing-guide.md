# 📦 Publishing Guide

Complete guide for publishing Drakonis Guard to npm.

## 🚀 Publishing Process

### 1. Update Package Information

First, let's update your `package.json` with proper npm information:

```json
{
  "name": "drakonis-guard",
  "version": "1.0.0",
  "description": "Flexible access control system for Node.js applications",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "module": "dist/index.js",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist/**/*",
    "README.md",
    "docs/**/*"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepare": "npm run build",
    "prepublishOnly": "npm run test && npm run build",
    "start:dev": "ts-node src/index.ts",
    "lint": "eslint src/ test/",
    "clean": "rm -rf dist node_modules",
    "version": "npm run build && git add -A dist",
    "postversion": "git push && git push --tags"
  },
  "keywords": [
    "access-control",
    "permissions",
    "rbac",
    "authorization",
    "typescript",
    "nestjs",
    "express",
    "middleware",
    "guard"
  ],
  "author": "Abdellah Chehri",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/drakonis-guard.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/drakonis-guard/issues"
  },
  "homepage": "https://github.com/yourusername/drakonis-guard#readme",
  "engines": {
    "node": ">=16.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^22.13.14",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.3.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.2"
  }
}
```

### 2. Create npm Account

If you don't have an npm account:

1. Go to [npmjs.com](https://www.npmjs.com)
2. Sign up for a free account
3. Verify your email address

### 3. Login to npm

```bash
npm login
```

Enter your npm username, password, and email.

### 4. Check Package Name Availability

```bash
npm view drakonis-guard
```

If the package name is taken, you'll need to choose a different name or use a scoped package:

```bash
npm view @yourusername/drakonis-guard
```

### 5. Build and Test

```bash
# Run tests
npm test

# Build the package
npm run build

# Check what will be published
npm pack --dry-run
```

### 6. Publish to npm

#### First Time Publishing

```bash
npm publish
```

#### For Scoped Packages (if name is taken)

```bash
npm publish --access public
```

### 7. Verify Publication

```bash
npm view drakonis-guard
```

## 🔄 Updating the Package

### 1. Update Version

Use semantic versioning:

```bash
# Patch version (bug fixes)
npm version patch

# Minor version (new features)
npm version minor

# Major version (breaking changes)
npm version major
```

### 2. Publish Update

```bash
npm publish
```

## 🏷️ Version Management

### Semantic Versioning

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Pre-release Versions

```bash
# Alpha version
npm version prerelease --preid=alpha

# Beta version
npm version prerelease --preid=beta

# Release candidate
npm version prerelease --preid=rc
```

## 🔧 Automated Publishing with GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build package
        run: npm run build
        
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Setup NPM_TOKEN

1. Go to npm → Access Tokens
2. Create a new token with "Automation" type
3. Add it to GitHub Secrets as `NPM_TOKEN`

## 📋 Pre-Publication Checklist

- [ ] Update `package.json` with correct information
- [ ] Update `README.md` with installation instructions
- [ ] Write comprehensive tests
- [ ] Build the package (`npm run build`)
- [ ] Test the built package locally
- [ ] Check package size (`npm pack --dry-run`)
- [ ] Verify all files are included
- [ ] Update version number
- [ ] Commit and tag the release

## 🚨 Common Issues

### Package Name Already Taken

```bash
# Use scoped package
npm init --scope=yourusername
```

### Permission Denied

```bash
# Check if you're logged in
npm whoami

# Login again if needed
npm login
```

### Build Errors

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### Missing Files

Make sure `files` array in `package.json` includes all necessary files:

```json
{
  "files": [
    "dist/**/*",
    "README.md",
    "docs/**/*",
    "LICENSE"
  ]
}
```

## 🔍 Post-Publication

### Test Installation

```bash
# Test in a new directory
mkdir test-install
cd test-install
npm init -y
npm install drakonis-guard
```

### Update Documentation

- Update GitHub README
- Update npm package description
- Add usage examples
- Document breaking changes

### Monitor Usage

- Check npm download stats
- Monitor GitHub issues
- Respond to user feedback

---

*With this guide, you'll be able to publish and maintain your package on npm successfully.* 🐉
