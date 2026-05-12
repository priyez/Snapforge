# Contributing

> Guide for contributing to the Screenshot API project.

---

## Development Setup

Follow the [Getting Started](./getting-started.md) guide to set up your local environment, then come back here.

---

## Project Structure

This is a **pnpm monorepo** managed by Turborepo. Key directories:

```
apps/
  api/        → Fastify API server
  worker/     → Puppeteer screenshot worker
  dashboard/  → React + Vite dashboard

packages/
  shared/     → Shared types, constants, validators
  queue/      → BullMQ queue definitions
  db/         → Prisma schema & client
  sdk/        → Public npm SDK
  tsconfig/   → Shared TypeScript configs
```

---

## Development Workflow

### Running in Development

```bash
# Start all services (API + Worker + Dashboard)
pnpm dev

# Or run individual services
pnpm --filter @screenshot-api/api dev       # API only (:3000)
pnpm --filter @screenshot-api/worker dev    # Worker only
pnpm --filter frontend dev                  # Dashboard only (:3300)
```

### Building

```bash
# Build everything
pnpm build

# Build a specific package
pnpm --filter @screenshot-api/shared build
```

### Linting

```bash
# Lint all packages
pnpm lint
```

### Testing

```bash
# Run all tests
pnpm test
```

### Database

```bash
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed test data
pnpm db:studio    # Open Prisma Studio
```

---

## Code Conventions

### TypeScript

- Strict mode enabled across all packages
- Use `type` imports for type-only imports: `import type { Foo } from "..."`
- Prefer `interface` over `type` for object shapes
- Use Zod for runtime validation at API boundaries

### API Routes

- All routes are registered in `apps/api/src/app.ts`
- Route files export an `async function register*Routes(app, env?)` function
- Use Zod schemas for request validation
- Return consistent `{ success, data }` or `{ success, error }` responses

### File Naming

- TypeScript files: `kebab-case.ts`
- React components: `PascalCase.tsx`
- Route files: `kebab-case.tsx` (TanStack Router convention)

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add webhook retry mechanism
fix: correct cache key generation for fullPage option
docs: update SDK examples
chore: upgrade Puppeteer to v24
```

---

## Adding a New API Route

1. Create a new route file in `apps/api/src/routes/`:

```typescript
// apps/api/src/routes/my-feature.ts
import type { FastifyInstance } from "fastify";

export async function registerMyFeatureRoutes(app: FastifyInstance) {
  app.get("/api/my-feature", async (request, reply) => {
    return reply.send({
      success: true,
      data: { message: "Hello!" },
    });
  });
}
```

2. Register it in `apps/api/src/app.ts`:

```typescript
import { registerMyFeatureRoutes } from "./routes/my-feature.js";

// Inside buildApp():
await registerMyFeatureRoutes(app);
```

---

## Adding a New Dashboard Page

1. Create a route file in `apps/dashboard/src/routes/`:

```tsx
// apps/dashboard/src/routes/my-page.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/my-page")({
  component: MyPage,
});

function MyPage() {
  return <div>My new page</div>;
}
```

2. The route is automatically registered by TanStack Router's file-based routing.

---

## Modifying the Database Schema

1. Edit the schema in `packages/db/prisma/schema.prisma`
2. Push changes to the database:

```bash
pnpm db:push
```

3. Rebuild the Prisma client:

```bash
pnpm --filter @screenshot-api/db build
```

4. Use the updated types in your code.

---

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code compiles without errors (`pnpm build`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] New API endpoints have Zod validation
- [ ] Database changes are reflected in `schema.prisma`
- [ ] Environment variables are documented in `.env.example`
- [ ] Commit messages follow Conventional Commits
