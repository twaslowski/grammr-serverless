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

- **Data access**: Drizzle ORM, exclusively. There are no Supabase `.from()`
  queries left in the codebase; do not reintroduce any.
- **Auth**: Supabase (`@supabase/ssr`) handles sessions and nothing else.
- **Connection**: `drizzle-orm/postgres-js` against the Supabase transaction
  pooler. `src/db/connect.ts` sets `prepare: false` because prepared statements
  are unsupported in that pool mode — do not remove it.
- **Authorization**: the connection uses a role that **bypasses RLS**. The
  `pgPolicy` definitions on the tables are therefore *not* enforced for
  application queries. Every query that touches user data must filter on
  `userId` explicitly. See "Authorization" below.

### Testing

- **Unit Tests**: Jest (`pnpm test`)
- **Type checking**: `pnpm typecheck` (`tsc --noEmit`). Jest does **not** type
  check: `next/jest` installs the SWC transform, so a `ts-jest` preset would be
  silently ignored. Type errors only surface here and in CI.
- **E2E Tests**: Playwright (`pnpm e2e`)
- **E2E Location**: `e2e/` directory
- **Test Config**: `jest.config.js` and `playwright.config.ts`
- **CI**: `.github/workflows/ci.yml` runs lint → typecheck → test → build, plus
  `pytest` per Lambda service.

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
│   │   ├── connect.ts    # Lazy singleton database handle
│   │   ├── schemas/      # Drizzle table schemas + relations.ts
│   │   └── migrations/   # Generated Drizzle migrations (source of truth)
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
├── supabase/             # Local Supabase CLI config only (no migrations)
├── e2e/                  # Playwright E2E tests
├── spec/                 # Feature specs
├── docs/
│   ├── agent/            # Agent summaries for major changes
│   ├── legacy-migrations/ # Pre-Drizzle SQL, kept for reference only
│   └── samples/          # Example API payloads
└── .github/
    ├── workflows/        # CI and release automation
    └── skills/           # Reusable coding patterns & best practices
```

---

## Database Architecture

### Drizzle ORM (Current Standard)

**Connection Setup:**

`src/db/connect.ts` exports a lazily-resolved singleton `db`. It is lazy so that
importing a module which touches the database does not require `DATABASE_URL`
at build time, and it passes `prepare: false` for the transaction pooler.

```typescript
import {db} from "@/db/connect";
```

**Schema Organization:**

- Individual tables defined in `src/db/schemas/*.ts`
- All tables re-exported from `src/db/schemas/schema.ts`
- **Relations defined centrally** in `src/db/schemas/relations.ts`, which
  `connect.ts` passes to `drizzle()`
- Always import tables from `@/db/schemas/schema`, never individual files

**Example Schema Pattern:**

```typescript
// src/db/schemas/deck.ts
export const decks = pgTable("deck", {
    id: serial().primaryKey().notNull(),
    name: varchar({length: 255}).notNull(),
    // ...
});

// src/db/schemas/schema.ts
export * from "./deck";

// src/db/schemas/relations.ts
export const relations = defineRelations({...schema, authUsers}, (r) => ({
    decks: {flashcards: r.many.flashcards()},
}));
```

**Migration Commands:**

```bash
pnpm db:generate   # Generate migrations from schema changes
pnpm db:push       # Push schema changes directly (dev)
pnpm db:migrate    # Apply migrations
```

**Migrations:** `src/db/migrations/` is the source of truth. `drizzle.config.ts`
reads `DATABASE_URL` (falling back to the local Supabase instance), so
`pnpm db:*` targets whichever environment that points at.
`docs/legacy-migrations/` holds the pre-Drizzle SQL for reference only.

---

## API Patterns

### 1. API Route Handlers (`with-api-handler`)

Located at `src/lib/api/with-api-handler.ts`

**Purpose:** Standardized wrapper for Next.js API routes that handles:

- Authentication validation (via Supabase auth)
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

**Purpose:** Type-safe API client for frontend code. Every call from
`src/lib/*` to this app's own API routes must go through one of these — do not
hand-roll `fetch` with an `if (!response.ok)` block.

| Helper | Use when |
|---|---|
| `createValidatedFetcher(schema)` | A response schema exists. Preferred. |
| `apiFetch(url, init, fallback)` | JSON response with no schema yet. |
| `apiFetchVoid(url, init, fallback)` | No meaningful response body. |
| `apiFetchBlob(url, init, fallback)` | Binary response (e.g. export download). |

```typescript
// src/lib/flashcards.ts
const fetchDecks = createValidatedFetcher(z.array(DeckSchema));

export async function getDecks(): Promise<Deck[]> {
    return fetchDecks("/api/v1/flashcards/decks", {method: "GET"});
}
```

All of them send `Content-Type: application/json` by default and surface the
API's `{ error }` body as the thrown Error's message.

### 3. API Gateway Integration (`api-gateway`)

Located at `src/lib/api/api-gateway.ts`

**Purpose:** Connect to AWS API Gateway for Lambda-backed NLP services.

Use `callApiGateway(path, body)` — it owns the config lookup, the `x-api-key`
header and JSON encoding. It throws `ApiGatewayNotConfiguredError` when the env
vars are absent; hand that to `apiGatewayNotConfiguredResponse(error)` for the
standard 503.

```typescript
let response: Response;
try {
    response = await callApiGateway(`/morphology/${language}`, {text});
} catch (error) {
    return apiGatewayNotConfiguredResponse(error);
}
```

Callers own the success path, because the Lambdas differ in what they return
(JSON vs. binary audio) and in how their failures should surface.

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

**Frontend (.env.local):** see `.env.example` for the authoritative list.

```bash
DATABASE_URL=postgresql://...            # PostgreSQL connection string
NEXT_PUBLIC_SUPABASE_URL=...             # Supabase project URL (auth)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... # Supabase publishable key (auth)
NEXT_PUBLIC_APPLICATION_URL=...          # Public base URL
API_GW_URL=https://...                   # API Gateway endpoint
API_GW_API_KEY=...                       # API Gateway API key
```

`pnpm build` requires all of these; page-data collection constructs the
database and Supabase clients.

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

3. **Export from the barrel, then declare relations:**
   ```typescript
   // src/db/schemas/schema.ts
   export * from "./myTable";

   // src/db/schemas/relations.ts — add to the defineRelations() call
   myTable: {
     deck: r.one.decks({from: r.myTable.deckId, to: r.decks.id}),
   },
   ```

   If the table holds user data, also add a wire schema under `src/types/` and
   extend `src/types/test/schema-parity.test.ts`. Do not import the table into
   `src/types/`.

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

### Authorization

The Drizzle connection bypasses RLS, so the `pgPolicy` definitions on the tables
do **not** protect application queries. Authorization is entirely the route's
job.

1. **Reads** must be scoped to the caller:
   ```typescript
   .where(eq(flashcardStudy.userId, user.id))
   ```

2. **Writes and deletes** must verify ownership before acting, and 404 when it
   fails. Several routes have a local `findOwned*` helper for this — follow that
   pattern:
   ```typescript
   async function findOwnedDeck(deckId: number, userId: string) {
     const [deck] = await db.select().from(decks)
       .where(and(eq(decks.id, deckId), eq(decks.userId, userId))).limit(1);
     return deck;
   }
   ```

3. **Indirect ownership** (a flashcard belongs to a deck which belongs to a
   user) must be joined through, not assumed — see
   `src/app/api/v1/flashcards/[id]/route.ts`.

4. **Public resources** need an explicit visibility check rather than no check
   at all — see `src/app/api/v1/flashcards/decks/study/[id]/route.ts`.

A missing filter is a data leak, not just a bug. When adding a route that reads
or writes user data, state which of the four cases applies.

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

**Problem:** Importing tables directly from individual files causes circular
dependency issues.

**Solution:** Always import from `@/db/schemas/schema` (the barrel), never from
an individual schema file.

```typescript
// ❌ BAD
import {decks} from "@/db/schemas/deck";

// ✅ GOOD
import {decks} from "@/db/schemas/schema";
```

### 1b. Never import `@/db/schemas/*` from `src/types/*`

**Problem:** Client components import `src/types/*`. Deriving those schemas with
`drizzle-zod` drags the whole `drizzle-orm/pg-core` table definition — RLS policy
SQL included — into the browser bundle.

**Solution:** The wire-format schemas in `src/types/*` are hand-written Zod and
must stay free of database imports. `src/types/test/schema-parity.test.ts`
compares them against the Drizzle tables and fails if they drift.

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

1. **Drizzle for data, Supabase for auth only** - There are no Supabase
   `.from()` queries left. Do not add any.

2. **Use established patterns** - Don't reinvent. Follow `withApiHandler`, `validated-fetcher`, etc.

3. **Type safety end-to-end** - Zod schemas for validation, TypeScript for static types.

4. **Server Components first** - Only use `"use client"` when necessary.

5. **Test everything** - Unit tests for logic, E2E tests for flows. Run
   `pnpm typecheck`; Jest does not type check.

6. **Document major changes** - Create agent summaries in `docs/agent/`.

7. **Follow composition patterns** - Reference `.github/skills/composition-patterns/`.

8. **Infrastructure as Code** - All AWS resources managed via Terraform.

9. **Keep it modular** - NLP services are independent Lambda functions.

10. **Async/await consistently** - No callbacks, no floating promises. In a
    serverless function a `void somePromise()` can be killed before it settles.

11. **Authorization is manual** - RLS is not enforced on the app connection.
    See "Authorization" above.

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
pnpm typecheck              # Run tsc --noEmit (Jest does NOT type check)
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
src/db/connect.ts                    # Lazy singleton database handle
src/db/schemas/schema.ts             # Table barrel
src/db/schemas/relations.ts          # Drizzle relations
src/lib/api/with-api-handler.ts      # API route wrapper
src/lib/api/validated-fetcher.ts     # Client-side API helpers
src/lib/api/api-gateway.ts           # callApiGateway + config
src/lib/client-only.ts               # useIsClient / useIsStandalone / useIsIOS
src/types/*                          # Wire schemas (no DB imports!)
drizzle.config.ts                    # Drizzle configuration
next.config.ts                       # Next.js configuration
.github/workflows/ci.yml             # CI pipeline
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

**Last Updated:** August 2026  
**Maintained by:** Tobias Waslowski  
**License:** GPL-3.0

