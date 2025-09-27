# Drakonis Guard

**Mythical Access Control System for Node.js Applications**  
Inspired by ancient dragon guardians, enforce your application's permissions with mythical precision.

---

## Installation

```bash
npm install drakonis-guard
```

---

## Quick Start

```typescript
import { AccessControl, PolicyBuilder } from "drakonis-guard";

// 1. Define your policy
const policy = new PolicyBuilder()
  .forRole("dragon-rider")
  .onResource("dragon")
  .can({
    feed: true,
    ride: (user, dragon) => dragon.tamed && user.hasSaddle,
  })
  .forRole("blacksmith")
  .onResource("forge")
  .can({
    craft: true,
    upgrade: (user, item) => item.quality < user.skillLevel,
  })
  .build();

// 2. Create guardian instance
const guardian = new AccessControl(policy);

// 3. Check permissions
const user = { roles: ["dragon-rider"], hasSaddle: true };
const dragon = { name: "Ignisar", tamed: true };

guardian.hasPermission(user, "dragon", "ride", dragon); // true
```

---

## Core Concepts

### 1. Policy Configuration

Define your access rules using the fluent builder:

```typescript
type User = { id: string; guild: string };
type Treasure = { value: number; guild: string };

const policy = new PolicyBuilder<User>()
  .forRole("guild-master")
  .onResource<Treasure>("treasure")
  .can({
    view: true,
    claim: (user, treasure) => treasure.guild === user.guild,
  })
  .build();
```

### 2. Permission Checks

Combine simple rules and magical conditions:

```typescript
.can({
  // Boolean rule (always true/false)
  basicAccess: true,

  // Function rule (dynamic evaluation)
  specialAccess: (user, resource) => {
    return user.magicLevel > resource.requiredPower;
  }
})
```
what should i do 
### 3. Access Control Instance

Create your realm's guardian:

```typescript
const guardian = new AccessControl(policy);

// Check permissions with optional resource data
guardian.hasPermission(user, "treasure", "claim", ancientRelic);
```

---

## Advanced Features

### Multiple Roles

```typescript
// Users can have multiple roles
const user = {
  roles: ["alchemist", "scribe"],
  potionLicense: true,
};

guardian.hasPermission(user, "library", "transcribe"); // Checks all roles
```

### Optional Data

```typescript
// Data-free checks (uses boolean rules only)
guardian.hasPermission(user, "tavern", "enter");

// Data-dependent checks (requires resource object)
guardian.hasPermission(user, "quest", "accept", currentQuest);
```

### Custom User Types

```typescript
type Mage = {
  rank: number;
  spells: string[];
  tower: string;
};

const policy = new PolicyBuilder<Mage>()
  .forRole("archmage")
  .onResource("spell-tome")
  .can({
    read: (mage, tome) =>
      mage.rank >= tome.requiredRank && mage.tower === tome.originTower,
  });
```

---

## Best Practices

### Start Restrictive

"Better to deny a dragon than unleash chaos."

```typescript
// Default deny policy
const policy = new PolicyBuilder()
  .forRole("peasant")
  .onResource("*")
  .can({ "*": false });
```

### TypeScript First

Leverage full type safety:

```typescript
.onResource<Dragon>('dragon')
  .can({
    // Autocomplete dragon properties
    train: (user, dragon) => dragon.age < 100
  })
```

### Realm Segmentation

Organize by domain:

```typescript
function configureTavernRules(builder: PolicyBuilder) {
  return builder.forRole("barkeep").onResource("ale-cask").can({ tap: true });
}
```

### Error Handling

```typescript
try {
  guardian.hasPermission(invalidUser, "artifact", "summon");
} catch (error) {
  console.error("Guardian blocked forbidden magic:", error);
}
```

---

## Real-World Example: Blog Platform

```typescript
type BlogUser = { id: string; isPremium: boolean };
type Article = { authorId: string; status: "draft" | "published" };

const blogPolicy = new PolicyBuilder<BlogUser>()
  .forRole("admin")
  .onResource("article")
  .can({ "*": true })

  .forRole("author")
  .onResource<Article>("article")
  .can({
    create: true,
    edit: (user, article) => article.authorId === user.id,
    publish: (user, article) => article.authorId === user.id && user.isPremium,
  })

  .forRole("reader")
  .onResource<Article>("article")
  .can({
    view: (_, article) => article.status === "published",
  })
  .build();
```

---

## Contribution

Join our guild of code smiths!  
Read our **[Contribution Guidelines](./CONTRIBUTING.md)** to help sharpen the dragon's claws.

---

> "Beware the guardian's gaze - for it sees all, permits only what is right."

**MIT License** © 2024 Abdellah Chehri
