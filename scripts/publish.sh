#!/bin/bash

# Drakonis Guard Publishing Script
# This script helps you publish your package to npm

set -e

echo "🐉 Drakonis Guard Publishing Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if user is logged in to npm
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Error: Not logged in to npm. Please run 'npm login' first."
    exit 1
fi

echo "✅ Logged in to npm as: $(npm whoami)"

# Check if package name is available
PACKAGE_NAME=$(node -p "require('./package.json').name")
echo "📦 Checking package name: $PACKAGE_NAME"

if npm view "$PACKAGE_NAME" > /dev/null 2>&1; then
    echo "⚠️  Package '$PACKAGE_NAME' already exists on npm"
    echo "   Current version: $(npm view "$PACKAGE_NAME" version)"
    echo "   You'll be publishing a new version"
else
    echo "✅ Package name '$PACKAGE_NAME' is available"
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Build the package
echo "🔨 Building package..."
npm run build

# Check what will be published
echo "📋 Checking package contents..."
npm pack --dry-run

# Ask for confirmation
echo ""
echo "🚀 Ready to publish!"
echo "   Package: $PACKAGE_NAME"
echo "   Version: $(node -p "require('./package.json').version")"
echo ""

read -p "Do you want to publish to npm? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Publishing to npm..."
    npm publish
    
    echo ""
    echo "🎉 Successfully published to npm!"
    echo "   View package: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Update your GitHub repository"
    echo "   2. Create a release tag: git tag v$(node -p "require('./package.json').version")"
    echo "   3. Push tags: git push --tags"
else
    echo "❌ Publishing cancelled"
fi
