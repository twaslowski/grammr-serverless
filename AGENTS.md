# AGENTS.md

**Project Guide for AI Coding Agents**

This document provides essential context and patterns for AI agents working on the grammr-serverless project. It covers
architecture, conventions, patterns, and critical workflows to ensure consistency and quality.

---

## Project Overview

**grammr** is a language learning platform focused on grammar practice through sentence translation, morphological
analysis, and spaced repetition flashcards. The system is highly modular with:

- **Frontend**: Next.js 16+ with React 19, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM (transitioning from Supabase)
- **Backend**: Next.js API routes + AWS Lambda functions for NLP operations
- **Infrastructure**: Terraform-managed AWS resources (Lambda, API Gateway, ECR)
- **Deployment**: Vercel (frontend), AWS (serverless functions), Supabase (database)

---

## Technology Stack

### Core Technologies

- **Framework**: Next.js (latest) with App Router and Turbopack
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: React hooks, Context API for global state
- **Validation**: Zod for runtime type validation
- **Build Tool**: pnpm (required, not npm/yarn)

### Database & ORM

- **Current State**: Drizzle ORM is the preferred solution
- **Legacy**: Supabase client still exists but is being phased out
- **Rule**: When writing new queries, **always use Drizzle**
- **Rule**: If you find Supabase queries in active code paths, refactor to Drizzle
- **Connection**: Direct PostgreSQL connection via `drizzle-orm/postgres-js`

### Testing

- **Unit Tests**: Jest (`pnpm test`)
- **E2E Tests**: Playwright (`pnpm e2e`)
- **E2E Location**: `e2e/` directory
- **Test Config**: `jest.config.js` and `playwright.config.ts`

### Python Backend

- **Lambda Functions**: Python-based NLP services in `lambda/`
- **Dependency Management**: `uv` (modern Python package manager)
- **Dockerization**: Larger functions use Docker with AWS Lambda base images
- **Languages Supported**: Multi-language morphology, inflections, translation, TTS

---

## Directory Structure

```
/
├── src/
│   ├── app/               # Next.js app router (pages, layouts, API routes)
│   │   ├── api/          # API route handlers
│   │   │   ├── v1/       # Version 1 API endpoints
│   │   │   └── v2/       # Version 2 API endpoints (if applicable)
│   │   ├── dashboard/    # Protected dashboard pages
│   │   ├── auth/         # Authentication pages
│   │   └── ...           # Other pages
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui base components
│   │   ├── flashcard/    # Flashcard-specific components
│   │   ├── translation/  # Translation UI components
│   │   └── ...           # Feature-specific components
│   ├── db/               # Database layer (Drizzle)
│   │   ├── connect.ts    # Database connection
│   │   ├── schemas/      # Drizzle table schemas
│   │   ├── migrations/   # Generated Drizzle migrations
│   │   └── util.ts       # Database utilities
│   ├── lib/              # Business logic & API clients
│   │   ├── api/          # API utilities (validated-fetcher, with-api-handler)
│   │   ├── flashcards.ts # Flashcard operations
│   │   ├── translation.ts # Translation operations
│   │   └── ...           # Other business logic modules
│   └── types/            # TypeScript type definitions
├── lambda/               # Python serverless functions
│   ├── morphology/       # Morphological analysis (spaCy)
│   ├── inflections-*/    # Inflection generation by language
│   ├── translate/        # Translation service
│   ├── tts/              # Text-to-speech (AWS Polly)
│   └── authorizer/       # API Gateway authorizer
├── terraform/            # Infrastructure as Code
│   ├── application/      # Main application infrastructure (Lambdas, API Gateway)
│   ├── bootstrap/        # Initial setup (S3, DynamoDB for state)
│   └── shared/           # Shared resources (ECR, IAM)
├── supabase/
│   └── migrations/       # Legacy migrations (still source of truth for schema)
├── e2e/                  # Playwright E2E tests
├── docs/                 # Documentation
│   ├── agent/            # Agent summaries for major changes
│   └── ...               # Feature specs
└── .github/skills/       # Reusable coding patterns & best practices
```

---

## Database Architecture

### Drizzle ORM (Current Standard)

**Connection Setup:**

```typescript
// src/db/connect.ts
import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, {prepare: false});
export const db = drizzle(client);
```

**Schema Organization:**

- Individual schemas defined in `src/db/schemas/*.ts`
- All schemas exported via `src/db/schemas/index.ts`
- **Relations defined centrally** in `index.ts` to avoid circular dependencies
- Always import schemas from `@/db/schemas` (the index), never individual files

**Example Schema Pattern:**

```typescript
// src/db/schemas/deck.ts
export const decks = pgTable("deck", {
    id: serial("id").primaryKey(),
    name: varchar("name", {length: 255}).notNull(),
    // ...
});

// src/db/schemas/index.ts
export * from "./deck";
export const decksRelations = relations(decks, ({one, many}) => ({
    // relations here
}));
```

**Migration Commands:**

```bash
pnpm db:generate   # Generate migrations from schema changes
pnpm db:push       # Push schema changes directly (dev)
pnpm db:migrate    # Apply migrations
```

**Legacy Note:** `supabase/migrations/` still contains the source of truth for the current schema. New migrations should
be managed via Drizzle.

---

## API Patterns

### 1. API Route Handlers (`with-api-handler`)

Located at `src/lib/api/with-api-handler.ts`

**Purpose:** Standardized wrapper for Next.js API routes that handles:

- Authentication validation (via Supabase - to be migrated)
- Request body validation (Zod)
- Query parameter validation (Zod)
- Route parameter validation (Zod)
- Error handling with consistent responses

**Usage Example:**

```typescript
// src/app/api/v1/flashcards/route.ts
import {withApiHandler} from "@/lib/api/with-api-handler";
import {z} from "zod";

export const GET = withApiHandler(
    {
        querySchema: z.object({
            deckId: z.coerce.number().optional(),
            search: z.string().optional(),
        }),
    },
    async ({user, query}) => {
        // user is authenticated
        // query is validated
        const result = await db.query.flashcards.findMany({
            where: eq(flashcards.userId, user.id),
        });
        return NextResponse.json(result);
    }
);

export const POST = withApiHandler(
    {
        bodySchema: CreateFlashcardSchema,
    },
    async ({user, body}) => {
        // body is validated against schema
        const result = await db.insert(flashcards).values({
            ...body,
            userId: user.id,
        });
        return NextResponse.json(result);
    }
);
```

**Configuration Options:**

- `requireAuth?: boolean` - Default: `true`
- `bodySchema?: ZodSchema<TBody>` - For POST/PATCH/PUT
- `paramsSchema?: ZodSchema<TParams>` - For dynamic routes
- `querySchema?: ZodSchema<TQuery>` - For query parameters

### 2. Client-Side Validated Fetcher (`validated-fetcher`)

Located at `src/lib/api/validated-fetcher.ts`

**Purpose:** Type-safe, validated API client for frontend code

**Usage Example:**

```typescript
// src/lib/flashcards.ts
import {createValidatedFetcher} from "@/lib/api/validated-fetcher";
import {z} from "zod";

const fetchDecks = createValidatedFetcher(z.array(DeckSchema));

export async function getDecks(): Promise<Deck[]> {
    return fetchDecks("/api/v1/flashcards/decks", {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    });
}
```

**Benefits:**

- Runtime validation of API responses
- Type safety end-to-end
- Consistent error handling
- Automatic JSON parsing

### 3. API Gateway Integration (`api-gateway`)

Located at `src/lib/api/api-gateway.ts`

**Purpose:** Connect to AWS API Gateway for Lambda-backed NLP services

**Configuration:**

```typescript
export function getApiGatewayConfig(): ApiGatewayConfig | undefined {
    const endpoint = process.env.API_GW_URL;
    const apiKey = process.env.API_GW_API_KEY;
    // Returns config if both are set
}
```

**Lambda Services Available:**

- Morphology analysis (`POST /morphology/{language}`)
- Inflections (`POST /inflections/{language}`)
- Translation (`POST /translate`)
- Text-to-speech (`POST /tts`)

**Terraform Configuration:** See `terraform/application/api-gateway.tf`

---

## React Patterns & Best Practices

### Component Organization

**Client vs Server Components:**

- **Default**: Server Components (no "use client" directive)
- **Use "use client"** only when needed:
    - Event handlers (`onClick`, `onChange`, etc.)
    - React hooks (`useState`, `useEffect`, etc.)
    - Browser APIs
    - Context consumers

**Current Client Components:**

- Most components in `src/components/` are client components
- Pages in `src/app/dashboard/` are mostly client components
- API routes are always server-side

### Composition Patterns

Reference: `.github/skills/composition-patterns/`

**Key Principles:**

1. **Avoid boolean prop proliferation** - Use compound components instead
2. **Lift state to context** when shared across multiple components
3. **Use render props** for flexible composition
4. **Separate concerns** - presentation vs logic

**Example: Confirmation Dialog Pattern**

See `docs/agent/CONFIRMATION_SYSTEM.md` for detailed implementation.

```typescript
// Usage in components
import {useConfirm} from "@/components/ui/confirmation-provider";

function MyComponent() {
    const confirm = useConfirm();

    const handleDelete = (item: Item) => {
        confirm({
            title: "Delete Item",
            description: `Are you sure you want to delete "${item.name}"?`,
            confirmText: "Delete",
            confirmVariant: "destructive",
            onConfirm: async () => {
                await deleteItem(item.id);
                toast.success("Item deleted!");
            },
        });
    };
}
```

**Benefits:**

- No state management in consuming components
- Imperative API with async support
- Consistent UX across the app
- Loading states handled automatically

### Performance Optimization

Reference: `.github/skills/react-best-practices/`

**Priority Areas:**

1. **Eliminate Waterfalls** (Critical)
    - Use React Server Components for data fetching
    - Parallel data fetching where possible
    - Avoid sequential client-side requests

2. **Bundle Size** (Critical)
    - Dynamic imports for heavy components
    - Tree-shake unused code
    - Use Next.js `next/dynamic` for code splitting

3. **Re-render Optimization** (Medium)
    - `useMemo` for expensive computations
    - `useCallback` for stable function references
    - `React.memo` for expensive components

---

## Infrastructure & Deployment

### Terraform Structure

**Location:** `terraform/`

**Stacks:**

1. **bootstrap/** - One-time setup (S3 backend, DynamoDB lock table)
2. **shared/** - Shared resources (ECR repositories, IAM roles)
3. **application/** - Main infrastructure (Lambdas, API Gateway, CloudWatch)

**Key Resources:**

- `lambda.tf` - Lambda function definitions
- `api-gateway.tf` - HTTP API Gateway with routes
- `authorizer.tf` - Custom Lambda authorizer for API Gateway
- `cloudwatch.tf` - Log groups and alarms
- `certificate.tf` - ACM certificates for custom domains
- `dns.tf` - Route53 records

**Workflow:**

```bash
cd terraform/application
terraform init -backend-config=config/dev.hcl
terraform plan -var-file=config/dev.tfvars
terraform apply -var-file=config/dev.tfvars
```

**Taskfile Alternative:**

```bash
task apply:dev   # Apply dev environment
task apply:prod  # Apply prod environment
```

### Lambda Functions

**Structure:**

```
lambda/<service-name>/
├── Dockerfile            # For Docker-based Lambdas
├── pyproject.toml        # Python dependencies (uv format)
├── uv.lock               # Lock file
├── README.md             # Service documentation
├── <service>/            # Python package
│   ├── __init__.py
│   ├── lambda_handler.py # Entry point
│   └── ...               # Service code
└── test/                 # Pytest tests
```

**Docker Pattern (for spaCy, large models):**

```dockerfile
FROM public.ecr.aws/lambda/python:3.12 AS builder
ARG SPACY_MODEL
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev > requirements.txt && \
    pip install -r requirements.txt --target ${LAMBDA_TASK_ROOT}

FROM public.ecr.aws/lambda/python:3.12
ARG SPACY_MODEL
COPY --from=builder ${LAMBDA_TASK_ROOT}/ ${LAMBDA_TASK_ROOT}/
COPY morphology/ ${LAMBDA_TASK_ROOT}/morphology/
RUN python -m spacy download ${SPACY_MODEL}
CMD [ "lambda_handler.handler" ]
```

**Build & Deploy Flow:**

1. Build Docker image: `docker build -t <service>:<tag> --build-arg SPACY_MODEL=en_core_web_sm .`
2. Push to ECR: Terraform creates ECR repos; CI/CD pushes images
3. Update Lambda: Terraform references image URI from ECR
4. API Gateway: Routes traffic to Lambda functions

**Testing:**

```bash
cd lambda/<service>
pytest                    # Run tests
python -m <service>.lambda_handler  # Local invocation
```

### Environment Variables

**Frontend (.env.local):**

```bash
DATABASE_URL=postgresql://...          # PostgreSQL connection string
NEXT_PUBLIC_SUPABASE_URL=...          # Legacy Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # Legacy Supabase anon key
API_GW_URL=https://...                # API Gateway endpoint
API_GW_API_KEY=...                    # API Gateway API key
```

**Lambda (via Terraform):**

- Environment variables set in `terraform/application/lambda.tf`
- Secrets managed via AWS Secrets Manager or SSM Parameter Store
- API Gateway key injected at invocation time

---

## Testing Strategy

### Unit Tests (Jest)

**Location:** Co-located with source files or in `src/lib/test/`

**Running:**

```bash
pnpm test           # Run all unit tests
pnpm test -- --watch  # Watch mode
```

**Patterns:**

- Test business logic in `src/lib/`
- Mock API calls with `jest.fn()`
- Use `@testing-library/react` for component tests
- Focus on behavior, not implementation

### E2E Tests (Playwright)

**Location:** `e2e/`

**Structure:**

```
e2e/
├── auth.setup.ts          # Authentication setup
├── test-data.ts           # Shared test data
└── tests/
    ├── flashcards.spec.ts
    ├── inflections.spec.ts
    └── translations.spec.ts
```

**Running:**

```bash
pnpm e2e                  # Run all E2E tests
pnpm e2e -- --ui          # Run with UI mode
pnpm e2e -- --project=chromium-ru  # Run specific project
```

**Multi-Language Testing:**

- Tests run across multiple languages: `ru`, `it`, `fr`, `es`, `pt`
- Projects defined in `playwright.config.ts`
- Use `testTargetLanguages` array to configure

**Best Practices:**

- Set up authentication state once in `auth.setup.ts`
- Use page objects for complex interactions
- Test critical user flows, not every edge case
- Keep tests independent and parallelizable

---

## Common Workflows

### Adding a New Database Table

1. **Create schema file:**
   ```bash
   touch src/db/schemas/myTable.ts
   ```

2. **Define table:**
   ```typescript
   // src/db/schemas/myTable.ts
   import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
   
   export const myTable = pgTable("my_table", {
     id: serial("id").primaryKey(),
     name: varchar("name", { length: 255 }).notNull(),
   });
   ```

3. **Export in index:**
   ```typescript
   // src/db/schemas/index.ts
   export * from "./myTable";
   
   // Add relations if needed
   import { myTable } from "./myTable";
   export const myTableRelations = relations(myTable, ({ one, many }) => ({
     // ...
   }));
   ```

4. **Generate migration:**
   ```bash
   pnpm db:generate
   ```

5. **Review and apply:**
   ```bash
   pnpm db:push  # or pnpm db:migrate for production
   ```

### Creating a New API Endpoint

1. **Create route file:**
   ```bash
   mkdir -p src/app/api/v1/my-endpoint
   touch src/app/api/v1/my-endpoint/route.ts
   ```

2. **Define schema:**
   ```bash
   touch src/app/api/v1/my-endpoint/schema.ts
   ```
   ```typescript
   import { z } from "zod";
   
   export const MyRequestSchema = z.object({
     name: z.string().min(1),
   });
   ```

3. **Implement handler:**
   ```typescript
   // route.ts
   import { withApiHandler } from "@/lib/api/with-api-handler";
   import { MyRequestSchema } from "./schema";
   
   export const POST = withApiHandler(
     { bodySchema: MyRequestSchema },
     async ({ user, body }) => {
       // Implementation
       return NextResponse.json({ success: true });
     }
   );
   ```

4. **Create client function:**
   ```typescript
   // src/lib/my-feature.ts
   export async function createMyThing(data: MyRequest): Promise<void> {
     const response = await fetch("/api/v1/my-endpoint", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(data),
     });
     if (!response.ok) throw new Error("Failed");
   }
   ```

5. **Add E2E test:**
   ```typescript
   // e2e/tests/my-feature.spec.ts
   import { test, expect } from "@playwright/test";
   
   test("should create my thing", async ({ page }) => {
     await page.goto("/dashboard/my-feature");
     // ...
   });
   ```

### Adding a New Lambda Function

1. **Create function directory:**
   ```bash
   mkdir lambda/my-function
   cd lambda/my-function
   ```

2. **Initialize Python project:**
   ```bash
   uv init
   touch Dockerfile pyproject.toml README.md
   mkdir my_function test
   ```

3. **Implement handler:**
   ```python
   # my_function/lambda_handler.py
   def handler(event, context):
       return {
           "statusCode": 200,
           "body": json.dumps({"result": "success"})
       }
   ```

4. **Add to Terraform:**
   ```terraform
   # terraform/application/lambda.tf
   module "my_function_lambda" {
     source = "terraform-aws-modules/lambda/aws"
     
     function_name = "grammr-my-function-${var.environment}"
     # ...
   }
   ```

5. **Add API Gateway route:**
   ```terraform
   # terraform/application/api-gateway.tf
   integrations = {
     "POST /my-function" = {
       lambda_arn = module.my_function_lambda.lambda_function_arn
     }
   }
   ```

6. **Deploy:**
   ```bash
   cd terraform/application
   terraform apply -var-file=config/dev.tfvars
   ```

### Refactoring Supabase to Drizzle

**When you find Supabase queries:**

1. **Identify the query:**
   ```typescript
   // OLD: Supabase
   const { data } = await supabase
     .from("flashcards")
     .select("*")
     .eq("user_id", userId);
   ```

2. **Convert to Drizzle:**
   ```typescript
   // NEW: Drizzle
   import { db } from "@/db/connect";
   import { flashcards } from "@/db/schemas";
   import { eq } from "drizzle-orm";
   
   const data = await db.query.flashcards.findMany({
     where: eq(flashcards.userId, userId),
   });
   ```

3. **Update imports:**
    - Remove `@supabase/supabase-js` imports
    - Add Drizzle imports

4. **Test thoroughly:**
    - Run unit tests
    - Run E2E tests
    - Verify in browser

5. **Document in commit:**
   ```
   refactor: migrate [feature] from Supabase to Drizzle
   
   - Replaced supabase.from() queries with Drizzle
   - Updated types to use Drizzle schemas
   - All tests passing
   ```

---

## Documentation Standards

### Code Comments

- **JSDoc for public APIs:** All exported functions should have JSDoc comments
- **Inline comments:** Explain "why", not "what"
- **Complex logic:** Add comments for non-obvious algorithms

### Agent Summaries

**Location:** `docs/agent/`

**When to create:**

- Major refactorings (e.g., Supabase → Drizzle migration)
- New feature implementations with multiple components
- Architectural changes
- Complex bug fixes with non-obvious solutions

**Template:**

```markdown
# [Feature/Change Name]

## Overview

Brief description of the change and why it was needed.

## Architecture

Technical details, design decisions, tradeoffs.

## Implementation

Key files changed, patterns used, gotchas.

## Testing

How to test, what was tested, edge cases.

## Future Work

Known limitations, potential improvements.
```

**Example:** `docs/agent/CONFIRMATION_SYSTEM.md`

---

## Common Pitfalls & Solutions

### 1. Circular Dependencies in Schemas

**Problem:** Importing schemas directly from individual files causes circular dependency issues.

**Solution:** Always import from `@/db/schemas` (the index file), never from individual schema files.

```typescript
// ❌ BAD
import {decks} from "@/db/schemas/deck";

// ✅ GOOD
import {decks} from "@/db/schemas";
```

### 2. Client/Server Boundary Confusion

**Problem:** Using server-only code in client components or vice versa.

**Solution:**

- Use `"use client"` directive explicitly when needed
- Keep business logic in `src/lib/` (can be shared)
- API calls from client components only
- Database queries in API routes or Server Components only

### 3. Missing Validation

**Problem:** API routes that don't validate input, leading to runtime errors.

**Solution:** Always use `withApiHandler` with Zod schemas:

```typescript
export const POST = withApiHandler(
    {bodySchema: CreateItemSchema},
    async ({body}) => {
        // body is already validated
    }
);
```

### 4. Inconsistent Error Handling

**Problem:** Mix of different error response formats.

**Solution:** Use `withApiHandler` which standardizes error responses, or follow the pattern:

```typescript
return NextResponse.json(
    {error: "User-friendly message"},
    {status: 400}
);
```

### 5. Database Connection Issues

**Problem:** Multiple database connections causing connection pool exhaustion.

**Solution:** Always import the singleton `db` instance:

```typescript
import {db} from "@/db/connect";  // Singleton
```

Never create new connections in individual files.

---

## Key Principles for Agents

1. **Prefer Drizzle over Supabase** - Always. Refactor Supabase queries when found.

2. **Use established patterns** - Don't reinvent. Follow `withApiHandler`, `validated-fetcher`, etc.

3. **Type safety end-to-end** - Zod schemas for validation, TypeScript for static types.

4. **Server Components first** - Only use `"use client"` when necessary.

5. **Test everything** - Unit tests for logic, E2E tests for flows.

6. **Document major changes** - Create agent summaries in `docs/agent/`.

7. **Follow composition patterns** - Reference `.github/skills/composition-patterns/`.

8. **Infrastructure as Code** - All AWS resources managed via Terraform.

9. **Keep it modular** - NLP services are independent Lambda functions.

10. **Async/await consistently** - No callbacks, no Promises without await.

---

## Quick Reference

### Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Build for production
pnpm start                  # Start production server

# Database
pnpm db:generate            # Generate Drizzle migrations
pnpm db:push                # Push schema changes
pnpm db:migrate             # Apply migrations
pnpm db:studio              # Open Drizzle Studio

# Testing
pnpm test                   # Run Jest tests
pnpm e2e                    # Run Playwright tests
pnpm lint                   # Run ESLint
pnpm fmt                    # Format with Prettier

# Infrastructure
task apply:dev              # Deploy dev infrastructure
task apply:prod             # Deploy prod infrastructure

# Supabase (legacy)
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
```

### Key Files

```
src/db/connect.ts                    # Database connection
src/db/schemas/index.ts              # Schema definitions & relations
src/lib/api/with-api-handler.ts      # API route wrapper
src/lib/api/validated-fetcher.ts     # Client-side API client
src/lib/api/api-gateway.ts           # AWS API Gateway config
drizzle.config.ts                    # Drizzle configuration
next.config.ts                       # Next.js configuration
terraform/application/               # Main infrastructure
.github/skills/                      # Reusable patterns
docs/agent/                          # Agent documentation
```

---

## Skills & Best Practices

The `.github/skills/` directory contains reusable coding patterns:

- **composition-patterns/** - React composition patterns from Vercel
- **react-best-practices/** - Performance optimization guidelines

Reference these when:

- Refactoring complex components
- Optimizing performance
- Reviewing code quality
- Implementing new features

---

## Getting Help

- **Documentation:** Check `docs/` for feature specs
- **Agent Summaries:** See `docs/agent/` for implementation details
- **Patterns:** Reference `.github/skills/` for best practices
- **README:** See `lambda/*/README.md` for service-specific docs
- **Contact:** `contact@grammr.app` for questions

---

**Last Updated:** February 2026  
**Maintained by:** Tobias Waslowski  
**License:** GPL-3.0

