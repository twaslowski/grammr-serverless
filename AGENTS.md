# AGENTS.md - Serverless Grammr Architecture Guide

## Project Overview

grammr is a language learning tool that aims to make understanding the grammar of a variety
of languages easier. It provides the user with the capability to take a translated sentence
by providing a word-by-word breakdown of the grammatical features of each word, as well as
inflection tables for verbs, nouns, adjectives, etc. Additionally, users can create flashcard
decks to help them memorize vocabulary and grammar concepts. Decks can be exported to Anki,
a popular spaced-repetition flashcard application.

grammr is now being rewritten for simplicity's sake into a hybrid serverless architecture using
Supabase Edge Functions for authenticated business logic and AWS Lambda for Python-based
language processing services.

The new architecture prioritizes simplicity and maintainability by:

- Removing unnecessary features and authentication layers
- Leveraging Supabase Edge Functions for all authenticated endpoints
- Using AWS Lambda **only** for Python-based morphology and inflections services (no auth required)
- Hosting the frontend on Vercel with a Supabase API domain for seamless authentication
- Eliminating the need for a separate auth validator (Supabase JWT context handles it)

This file outlines the core features and principles of the new serverless architecture.

### Core Principle

Most endpoints are **authenticated via Supabase Auth**. Supabase Edge Functions receive the user context
automatically; no manual JWT validation needed. Only the morphology and inflections Lambda functions
are **unauthenticated** (public endpoints for text analysis and word inflection lookup).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
└──────────────────────┬──────────────────────────────────────────┘
│
┌─────────────┴──────────────────────────┐
│                                        │
┌────▼─────────┐                   ┌────────▼────────┐
│ grammr.com   │                   │ api.grammr.com   │
│ (Vercel)     │                   │ (Supabase)       │
│ Frontend     │                   │ Edge Functions   │
└────┬─────────┘                   └────────┬─────────┘
│                                        │
│  1. Login/Signup                       │ 2. Authenticated API Calls
│     (Supabase Auth)                    │     (JWT in header, auto-validated)
│                                        │
└────────────┬────────────────────────────┘
│
┌────────────▼─────────────────┐
│   Supabase                    │
│   ├─ Auth (JWT issuance)      │
│   ├─ Edge Functions           │
│   │  ├─ translation           │
│   │  ├─ flashcard-crud        │
│   │  └─ anki-exporter         │
│   └─ PostgreSQL (RLS)         │
└────────────┬─────────────────┘
│
│  (Unauthenticated requests)
│
┌────────────▼────────────────────────────┐
│    AWS Lambda (Python-only)              │
│  (No authentication required)             │
│                                          │
│  ├─ morphology (text analysis)           │
│  └─ inflections (conjugation/declension) │
└──────────────────────────────────────────┘
```

### Service Separation

**Supabase Edge Functions** (authenticated, integrated with Supabase Auth):

1. **translation**: Translate text + provide word-level translations
2. **flashcard-crud**: Create/read/update/delete decks and flashcards
3. **anki-exporter**: Generate APKG files from decks

**AWS Lambda** (unauthenticated, Python-based):

1. **morphology**: Morphological analysis (spaCy-based, Docker image)
2. **inflections**: Conjugation/declension tables (per-language Lambdas)

---

## Authentication & Authorization Model

### Token Flow (Supabase Edge Functions)

1. **Frontend (Vercel)** → User logs in via Supabase Auth UI

- Supabase issues a JWT token with the user's ID and claims
- Token is stored in client-side session/localStorage

2. **Frontend** → API calls include token in `Authorization: Bearer <token>` header

- All requests to `api.grammr.com/*` include this header

3. **Supabase Edge Function** → Receives validated user context automatically

- No manual JWT validation needed
- `auth` context is injected by Supabase runtime
- User ID available via `auth.user()` or similar
- Can scope database queries via RLS

4. **Database** → RLS policies enforce user isolation

- Example: A user can only see their own decks/flashcards
- Database enforces this; application code doesn't need ownership checks

### Unauthenticated Flow (Lambda Functions)

1. **Frontend** → Calls morphology or inflections Lambda (no auth header needed)

- Direct HTTP call to Lambda function URL or API Gateway endpoint

2. **Lambda** → Processes request without authentication

- No user context available
- Returns results without scoping to user

---

## Database Schema (Supabase PostgreSQL)

### Core Tables

```sql
-- User profile (managed by Supabase Auth, extended with app data)
CREATE TABLE profiles
(
    id              UUID PRIMARY KEY REFERENCES auth.users (id),
    source_language VARCHAR(3) NOT NULL, -- User's native language (e.g., 'en', 'de')
    target_language VARCHAR(3) NOT NULL, -- Language user is learning (e.g., 'ru', 'fr')
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Flashcard decks
CREATE TABLE decks
(
    id          UUID PRIMARY KEY,
    user_id     UUID         NOT NULL REFERENCES profiles (id),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);

-- Individual flashcards
CREATE TABLE flashcards
(
    id          UUID PRIMARY KEY,
    deck_id     UUID NOT NULL REFERENCES decks (id) ON DELETE CASCADE,
    front       TEXT NOT NULL, -- Word or phrase in target language
    back        TEXT NOT NULL, -- Definition, translation, or explanation
    paradigm_id UUID,          -- Reference to inflection paradigm (if applicable)
    created_at  TIMESTAMP DEFAULT NOW(),
    updated_at  TIMESTAMP DEFAULT NOW()
);
```

### RLS Policies

```sql
-- Users can only see their own decks
CREATE POLICY "Users see own decks" ON decks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own decks" ON decks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own decks" ON decks
    FOR UPDATE USING (auth.uid() = user_id);

-- Cascade: flashcards inherit deck ownership via foreign key
```

---

## API Routes

### Design Pattern: Unified Supabase API Domain

All authenticated endpoints are served by Supabase Edge Functions at `api.grammr.com`.

```
api.grammr.com
├── /analysis
│   ├── POST /translate         (authenticated; text translation + word lookup)
│   └── POST /morphology        (unauthenticated; Lambda call)
│
├── /inflections
│   └── GET  /{language}/{word} (unauthenticated; Lambda call)
│
├── /flashcards
│   ├── GET  /decks             (authenticated; list user's decks)
│   ├── POST /decks             (authenticated; create deck)
│   ├── GET  /decks/{deckId}    (authenticated; get deck details + cards)
│   ├── POST /decks/{deckId}/cards (authenticated; add card to deck)
│   ├── DELETE /decks/{deckId}/cards/{cardId} (authenticated)
│
└── /export
    └── POST /anki              (authenticated; deck ID → APKG file)
```

### Unauthenticated Endpoints (Lambda Proxy)

Supabase Edge Functions can proxy requests to Lambda:

```typescript
// POST /analysis/morphology
// Supabase Edge Function acts as proxy to Lambda
const response = await fetch(`${LAMBDA_BASE_URL}/morphology`, {
  method: "POST",
  body: event.body,
});
return response;
```

Alternatively, expose Lambda functions directly:

- `https://morphology.lambda.aws.amazon.com/...` (function URL)
- Frontend calls Lambda directly, bypassing Supabase (reduces latency for unauthenticated calls)

---

## Supabase Edge Functions

### 1. **translation** (TypeScript)

**Purpose**: Translate text and provide word-level translations

**Trigger**: `POST /analysis/translate`

**Authentication**: Required (Supabase Auth context)

**Handler Logic**:

```typescript
import { createClient } from "@supabase/supabase-js";

export default async (req: Request) => {
  const auth = await req.json(); // Supabase injects auth
  const { text, source_language, target_language } = await req.json();

  // User ID available
  const userId = auth.user().id;

  // Call translation service (OpenAI, LibreTranslate, etc.)
  const semanticTranslation = await translateText(
    text,
    source_language,
    target_language,
  );
  const wordTranslations = await getWordTranslations(
    text,
    source_language,
    target_language,
  );

  return new Response(
    JSON.stringify({
      semantic_translation: semanticTranslation,
      tokens: wordTranslations,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
};
```

**Environment Variables**:

- `TRANSLATION_SERVICE_KEY`: API key for translation service
- `SUPABASE_URL`: For caching results (optional)

---

### 2. **flashcard-crud** (TypeScript)

**Purpose**: Create, read, update, delete decks and flashcards

**Triggers**:

- `GET /flashcards/decks`
- `POST /flashcards/decks`
- `GET /flashcards/decks/{deckId}`
- `POST /flashcards/decks/{deckId}/cards`
- `DELETE /flashcards/decks/{deckId}/cards/{cardId}`

**Authentication**: Required (Supabase Auth context)

**Handler Pattern**:

```typescript
import { createClient } from "@supabase/supabase-js";

export default async (req: Request) => {
  const auth = await req.json(); // Supabase auth context
  const userId = auth.user().id;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY, // Or use anon key with RLS
  );

  // Route based on method + path
  const url = new URL(req.url);
  const method = req.method;

  if (method === "GET" && url.pathname === "/flashcards/decks") {
    // RLS automatically filters to user's decks
    const { data } = await supabase
      .from("decks")
      .select("*")
      .eq("user_id", userId);
    return new Response(JSON.stringify(data));
  }

  if (method === "POST" && url.pathname === "/flashcards/decks") {
    const { name, description } = await req.json();
    const { data } = await supabase
      .from("decks")
      .insert({ user_id: userId, name, description })
      .select();
    return new Response(JSON.stringify(data[0]));
  }

  // ... handle other routes
};
```

**Environment Variables**:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for bypassing RLS if needed, or use anon key)

---

### 3. **anki-exporter** (TypeScript/Python)

**Purpose**: Generate Anki-compatible APKG files from decks

**Trigger**: `POST /export/anki`

**Authentication**: Required (Supabase Auth context)

**Handler Logic**:

```typescript
import { createClient } from "@supabase/supabase-js";

export default async (req: Request) => {
  const auth = await req.json();
  const { deckId } = await req.json();
  const userId = auth.user().id;

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  // Fetch deck + cards (RLS ensures user ownership)
  const { data: deck } = await supabase
    .from("decks")
    .select("*, flashcards(*)")
    .eq("id", deckId)
    .eq("user_id", userId)
    .single();

  if (!deck) {
    return new Response(JSON.stringify({ error: "Deck not found" }), {
      status: 404,
    });
  }

  // Generate APKG file
  const apkgBuffer = await generateAPKG(deck);

  // Option 1: Return binary directly (if under response size limit)
  return new Response(apkgBuffer, {
    headers: {
      "Content-Type": "application/vnd.anki.apkg",
      "Content-Disposition": `attachment; filename="${deck.name}.apkg"`,
    },
  });

  // Option 2: Upload to S3 and return signed URL
  // const url = await uploadToS3(apkgBuffer, `${userId}/${deckId}.apkg`);
  // return new Response(JSON.stringify({ download_url: url }));
};
```

**Notes**:

- Response size limit ~6 MB for Supabase Edge Functions
- If needed, upload to S3 and return signed URL instead

---

## AWS Lambda Functions (Python-only, Unauthenticated)

### 1. **morphology** (Python, Docker image)

**Purpose**: Grammatical analysis of text (lemmatization, POS tagging, features)

**Trigger**:

- Direct Lambda function URL or API Gateway `POST /analysis/morphology`
- Called by frontend directly (no authentication)

**Input**:

```json
{
  "text": "The quick brown fox",
  "language": "en"
}
```

**Output**:

```json
{
  "tokens": [
    {
      "source_text": "The",
      "lemma": "the",
      "pos": "DET",
      "features": {
        "definite": "Def"
      }
    },
    ...
  ]
}
```

**Dependencies**:

- spaCy models (en_core_web_sm, ru_core_news_sm, de_core_news_sm, etc.)
- Must run as Docker image (spaCy models too large for standard Lambda)
- ECR repository: `grammrapp/morphology:latest`

**Notes**:

- **No authentication** required
- Largest Lambda by size; Docker image ~1GB+
- Consider caching frequently analyzed text server-side or in Redis (post-MVP optimization)

---

### 2. **inflections** (Python, language-specific)

**Purpose**: Generate inflection tables (conjugation, declension) for a word

**Variants**:

- `inflections-ru` (Russian): uses `pymorphy3`
- `inflections-latin` (French, Italian, Spanish, Portuguese, Romanian): uses `verbecc`
- `inflections-de` (German): future expansion
- etc.

**Trigger**:

- Direct Lambda function URL or API Gateway `GET /inflections/{language}/{word}`
- Called by frontend directly (no authentication)

**Input**:

```
GET /inflections/ru/идти?pos=VERB
```

**Output**:

```json
{
  "lemma": "идти",
  "language": "ru",
  "pos": "VERB",
  "paradigm": {
    "infinitive": "идти",
    "present_1st_singular": "иду",
    "present_2nd_singular": "идёшь",
    ...
  }
}
```

**Dependencies**:

- `pymorphy3` (Russian)
- `verbecc` (Latin languages)
- May be Docker images or Python zip packages depending on size

**Notes**:

- **No authentication** required
- Public endpoint; can be cached aggressively by frontend

---

## Frontend Application (Vercel)

### Technology Stack

The frontend is a modern single-page application built with:

- **Vite**: Lightning-fast build tool and development server
- **React**: UI library for building interactive components
- **TypeScript**: Type-safe JavaScript for maintainable code
- **Tailwind CSS**: Utility-first CSS framework for styling
- **shadcn-ui**: High-quality, unstyled, accessible React components built on Radix UI
- **Supabase Client**: Official JavaScript client for authentication and API calls

### Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── auth/           # Authentication UI (login, signup)
│   │   ├── analysis/       # Text analysis and translation UI
│   │   ├── flashcards/     # Flashcard deck management
│   │   └── common/         # Shared components (layout, navigation)
│   ├── pages/              # Page-level components (if using routing)
│   ├── lib/                # Utility functions and helpers
│   │   ├── api.ts          # API client wrappers
│   │   ├── supabase.ts     # Supabase client initialization
│   │   └── utils.ts        # General utilities
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   └── useApi.ts       # API call hook with error handling
│   ├── types/              # TypeScript type definitions
│   ├── styles/             # Global styles and Tailwind config
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── package.json
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

### Key Features

#### 1. **Authentication (Supabase Auth)**

- User signup and login via email/password
- Session management with JWT tokens
- Protected routes requiring authentication
- Profile setup (source and target language selection)

**Example Hook**:

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
  }, []);

  return { user, isLoading };
}
```

#### 2. **Text Analysis & Translation**

- Input text in target language
- Fetch morphological analysis (lemma, POS tags, features)
- Display word-by-word breakdown with translations
- Show grammatical features for each token

**Component Pattern**:

```typescript
// components/analysis/TextAnalyzer.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function TextAnalyzer() {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analysis/morphology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: 'en' }),
      })
      const data = await response.json()
      setAnalysis(data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to analyze..."
      />
      <Button onClick={handleAnalyze} disabled={isLoading || !text}>
        {isLoading ? 'Analyzing...' : 'Analyze'}
      </Button>
      {analysis && <TokenDisplay tokens={analysis.tokens} />}
    </div>
  )
}
```

#### 3. **Flashcard Management**

- Create and manage decks
- Add flashcards with front/back content
- Edit and delete cards
- Export decks to Anki format

**API Client Pattern**:

```typescript
// lib/api.ts
import { supabase } from "./supabase";

export const api = {
  async createDeck(name: string, description?: string) {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch("/api/flashcards/decks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description }),
    });
    return response.json();
  },

  async getDecks() {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch("/api/flashcards/decks", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  async exportToAnki(deckId: string) {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch("/api/export/anki", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deckId }),
    });
    return response.blob();
  },
};
```

#### 4. **Inflections & Conjugation Tables**

- Display conjugation/declension tables for words
- Language-specific formatting
- Integration with analysis view

**Component Pattern**:

```typescript
// components/analysis/InflectionTable.tsx
import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function InflectionTable({ word, language }: Props) {
  const [paradigm, setParadigm] = useState(null)

  useEffect(() => {
    fetch(`/api/inflections/${language}/${word}`)
      .then((r) => r.json())
      .then(setParadigm)
  }, [word, language])

  if (!paradigm) return <div>Loading...</div>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Form</TableHead>
          <TableHead>Inflection</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(paradigm.paradigm).map(([form, inflection]) => (
          <TableRow key={form}>
            <TableCell className="font-medium">{form}</TableCell>
            <TableCell>{inflection}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Styling & UI Components

**Tailwind Configuration**:

- Custom color scheme aligned with brand
- Responsive breakpoints for mobile/tablet/desktop
- Dark mode support (optional, via shadcn-ui theme)

**shadcn-ui Components Used**:

- `Button`: Primary, secondary, and icon buttons
- `Input` / `Textarea`: Form inputs
- `Card`: Content containers
- `Table`: Inflection and analysis displays
- `Dialog`: Modal forms (create deck, add card)
- `Tabs`: Navigation and content organization
- `Badge`: Labels and tags (POS, features)
- `Toast`: User feedback and notifications
- `Dropdown-Menu`: Context menus and options
- `Skeleton`: Loading placeholders

**Example Theme Customization**:

```typescript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6", // Blue
        secondary: "#8B5CF6", // Purple
        accent: "#F59E0B", // Amber
      },
    },
  },
};
```

### Development Workflow

**Local Development**:

```bash
cd frontend
pnpm install                    # Install dependencies
pnpm dev                        # Start dev server (localhost:5173)
pnpm build                      # Build for production
pnpm preview                    # Preview production build locally
pnpm lint                       # Run ESLint
```

**Environment Variables** (`.env.local`):

```
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-key>
VITE_API_BASE_URL=http://localhost:54321  # For local dev
```

**Component Development with Storybook** (optional, future enhancement):

```bash
pnpm add -D storybook @storybook/react
pnpm storybook
```

### API Integration

**Centralized API Client**:

The `lib/api.ts` module provides typed wrappers around all backend endpoints. This ensures:

- Consistent error handling
- Automatic JWT token injection
- Type safety for requests and responses

**Example**:

```typescript
// Automatic token injection
const token = await getAuthToken();
const response = await fetch("/api/endpoint", {
  headers: { Authorization: `Bearer ${token}` },
});
```

### Deployment

**Vercel Deployment**:

1. Connect GitHub repository to Vercel
2. Vercel automatically detects Vite configuration
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL=https://api.grammr.com`

4. On push to `main` branch:
   - Production deployment (auto-scaled, CDN-cached)
   - Custom domain: `grammr.com`

5. On push to `develop` branch:
   - Preview deployment (staging environment)

**Build Process**:

```bash
# Vite optimized build
pnpm build
# Output: dist/
# Vercel serves via CDN with automatic code splitting
```

### Code Splitting & Performance

- **Lazy Loading**: React.lazy() for route-based code splitting
- **Image Optimization**: Vercel's built-in image optimization
- **Tree Shaking**: Unused imports removed via Vite/esbuild
- **Bundle Analysis**: Use `vite-plugin-visualizer` to analyze bundle size

**Example Lazy Route**:

```typescript
// App.tsx
import { lazy, Suspense } from 'react'

const AnalysisPage = lazy(() => import('./pages/Analysis'))
const FlashcardsPage = lazy(() => import('./pages/Flashcards'))

export function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      {/* Route component loads on demand */}
    </Suspense>
  )
}
```

### Testing

**Unit Tests** (Vitest):

```bash
pnpm add -D vitest @testing-library/react
```

**Example Test**:

```typescript
// components/__tests__/TextAnalyzer.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TextAnalyzer } from '../analysis/TextAnalyzer'

describe('TextAnalyzer', () => {
  it('sends analysis request on button click', async () => {
    const user = userEvent.setup()
    render(<TextAnalyzer />)

    const textarea = screen.getByPlaceholderText('Paste text to analyze...')
    const button = screen.getByRole('button', { name: /analyze/i })

    await user.type(textarea, 'hello world')
    await user.click(button)

    // Assert loading state, then results
  })
})
```

### Browser Compatibility

- **Target**: Modern browsers (last 2 versions)
- **Vite Build**: Automatically polyfills via esbuild
- **Mobile**: Responsive design; tested on iOS/Android

---

## Infrastructure as Code

### Supabase Configuration

**Supabase Project Setup**:

1. Create project (PostgreSQL 15+)
2. Enable Auth with email provider
3. Deploy Edge Functions via Supabase CLI:

```bash
supabase functions deploy translation --project-ref <project-id>
supabase functions deploy flashcard-crud --project-ref <project-id>
supabase functions deploy anki-exporter --project-ref <project-id>
```

**Project Structure**:

```
supabase/
├── functions/
│   ├── translation/
│   │   ├── index.ts
│   │   └── deps.ts
│   ├── flashcard-crud/
│   │   ├── index.ts
│   │   └── deps.ts
│   └── anki-exporter/
│       ├── index.ts
│       └── deps.ts
├── migrations/
│   └── 001_init_schema.sql
└── config.toml
```

**Environment Variables** (in `supabase/config.toml` or Supabase dashboard):

```toml
[env.prod]
TRANSLATION_SERVICE_KEY = "sk-..."
SUPABASE_URL = "https://project.supabase.co"
```

---

### Terraform Configuration (Lambda only)

**Directory Structure**:

```
terraform/
├── application/
│   ├── main.tf              # AWS configuration
│   ├── variables.tf         # Input variables
│   ├── outputs.tf           # Output values
│   ├── lambda.tf            # Lambda function definitions (morphology, inflections)
│   ├── iam.tf               # Roles and policies
│   └── config/
│       ├── dev.tfvars       # Development environment vars
│       └── prod.tfvars      # Production environment vars
├── shared/
│   └── ecr.tf               # ECR repositories for Lambda Docker images
├── vercel/
│   └── ...                  # Vercel configuration (existing)
└── dns/
    └── route53.tf           # DNS records (morphology.grammr.com, etc.)
```

---

## OpenAPI Specification

**File**: `openapi.yaml` (at project root or `docs/openapi.yaml`)

**Purpose**: Comprehensive API documentation; source of truth for routes, schemas, and examples.

**Example Structure**:

```yaml
openapi: 3.0.0
info:
  title: Grammr API
  version: 1.0.0
  description: Language learning platform API

servers:
  - url: https://api.grammr.com
    description: Production (Supabase Edge Functions + Lambda)

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    MorphologyResponse:
      type: object
      properties:
        tokens:
          type: array
          items:
            type: object

paths:
  /analysis/morphology:
    post:
      summary: Analyze text morphologically
      operationId: analyzeMorphology
      security: [] # No auth required
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                text:
                  type: string
                language:
                  type: string
      responses:
        "200":
          description: Morphological analysis

  /analysis/translate:
    post:
      summary: Translate text
      operationId: translateText
      security:
        - bearerAuth: [] # Auth required
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                text:
                  type: string
                source_language:
                  type: string
                target_language:
                  type: string
      responses:
        "200":
          description: Translation with word-level data
        "401":
          description: Unauthorized

  /flashcards/decks:
    get:
      summary: List user's decks
      operationId: listDecks
      security:
        - bearerAuth: []
      responses:
        "200":
          description: List of decks
        "401":
          description: Unauthorized
    post:
      summary: Create a new deck
      operationId: createDeck
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name:
                  type: string
                description:
                  type: string
```

---

## Development Workflow

### Local Development

**Frontend Development** (Vercel locally):

```bash
cd frontend
pnpm install
pnpm dev
# Runs on localhost:3000
```

**Supabase Functions Locally** (Supabase CLI):

```bash
supabase functions serve --env-file .env.local
# Runs on http://localhost:54321
```

**Lambda Testing** (AWS SAM or local Docker):

```bash
# Test morphology Lambda locally
docker build -t grammr-morphology ./microservices/morphology
docker run -p 9000:8080 grammr-morphology
curl -X POST http://localhost:9000/2015-03-31/functions/function/invocations \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","language":"en"}'
```

### CI/CD

**GitHub Actions** (`.github/workflows/`):

1. **Lint & Test**: Run on every PR

- Frontend: `pnpm lint`, `pnpm build`
- Edge Functions: Unit tests
- Lambda: Unit tests for each function

2. **Deploy to Dev**: On push to `develop` branch

- Frontend: Deploy to Vercel preview
- Supabase: Deploy Edge Functions to dev project
- Lambda: Build and push Docker images to ECR, update Lambda via Terraform

3. **Deploy to Prod**: On push to `main` branch (manual approval)

---

## Supabase Integration

### Project Setup

1. **Create Supabase Project** (or use existing)

- Database: PostgreSQL 15+
- Auth: Enable with email provider
- API Key (anon): For frontend auth
- Service Role Key: For Edge Functions database access

2. **Environment Variables**:

   ```
   SUPABASE_URL=https://<project-id>.supabase.co
   SUPABASE_ANON_KEY=<public-key>
   SUPABASE_SERVICE_ROLE_KEY=<private-key>
   ```

3. **Frontend Auth Configuration**:

   ```typescript
   // frontend/src/lib/supabase.ts
   import { createClient } from "@supabase/supabase-js";

   export const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
   );
   ```

4. **Migrations** (Supabase SQL Editor):

```bash
supabase db push  # Apply migrations to remote project
```

---

## Deployment Strategy

### Environments

**Development** (`dev`):

- Supabase dev project (separate branch)
- Lambda functions deployed to `dev` stage
- Testing via manual requests or API client

**Production** (`prod`):

- Supabase production project
- Lambda functions deployed to `prod` stage
- Domain: `api.grammr.com`

### Deployment Checklist

1. **Supabase Edge Functions**:

   ```bash
   supabase functions deploy --project-ref <prod-project-id>
   ```

2. **Lambda + Terraform**:

   ```bash
   cd terraform/application
   terraform plan -var-file=config/prod.tfvars
   terraform apply -var-file=config/prod.tfvars
   ```

3. **Database Migrations**:

   ```bash
   supabase db push --project-ref <prod-project-id>
   ```

4. **Frontend Deployment** (Vercel):

- Automatic on push to `main` branch

---

## Key Architectural Decisions

### Why Supabase Edge Functions for Most Services?

1. **Integrated Authentication**: User context is injected automatically; no manual JWT validation needed
2. **Direct Database Access**: Built-in Supabase client; RLS policies enforced automatically
3. **Simpler Deployment**: Deploy via Supabase CLI; no Terraform needed
4. **Cost-Effective**: Included in Supabase pricing; no additional API Gateway costs
5. **Lower Latency**: Supabase infrastructure optimized for Postgres queries

### Why Lambda Only for Python Services?

1. **Python Dependencies**: Supabase Edge functions run on TypeScript only, so Python services must be separate
2. **No Auth Needed**: Morphology and inflections are public, read-only operations; this means the API Gateway can run unauthenticated
3. **Cost**: It is much cheaper to run these infrequent, CPU-bound tasks on Lambda than on a continuously running server
4. **Scalability**: Lambda auto-scales based on demand; ideal for bursty workloads
5. **Convenience**: Easy to package Python code with dependencies using Docker or zip files

## Common Development Tasks

### Adding a New Supabase Edge Function

1. **Create function directory**:

   ```bash
   supabase functions new my-feature
   ```

2. **Implement handler** (`supabase/functions/my-feature/index.ts`):

   ```typescript
   import { createClient } from "@supabase/supabase-js";

   export default async (req: Request) => {
     const auth = req.headers.get("authorization")?.split(" ")[1];
     const supabase = createClient(
       process.env.SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!,
     );

     // Use auth context and Supabase client
     return new Response(JSON.stringify({ success: true }));
   };
   ```

3. **Deploy**:

   ```bash
   supabase functions deploy my-feature
   ```

4. **Document in OpenAPI**:
   ```yaml
   paths:
     /my-feature:
       post:
         operationId: myFeature
         security:
           - bearerAuth: []
   ```

### Adding a New Lambda Function (Python)

1. **Create function directory**:

   ```
   microservices/new-python-service/
   ├── index.py
   ├── requirements.txt
   ├── tests/
   └── Dockerfile
   ```

2. **Define Terraform resource** (`terraform/application/lambda.tf`):

   ```hcl
   resource "aws_lambda_function" "new_service" {
     function_name = "grammr-new-service"
     ...
   }

   resource "aws_lambda_function_url" "new_service" {
     function_name      = aws_lambda_function.new_service.function_name
     authorization_type = "NONE"
   }
   ```

3. **Deploy**:
   ```bash
   terraform apply -var-file=config/dev.tfvars
   ```

### Testing Locally

**Supabase Edge Function**:

```bash
supabase functions serve --env-file .env.local
curl -X POST http://localhost:54321/functions/v1/my-feature \
  -H "Authorization: Bearer <test-token>" \
  -H "Content-Type: application/json" \
  -d '{"key":"value"}'
```

**Lambda Function**:

```bash
sam local start-api
curl -X POST http://localhost:3000/analysis/morphology \
  -H "Content-Type: application/json" \
  -d '{"text":"hello","language":"en"}'
```

---

## Monitoring & Observability

### Supabase Edge Functions

- **Logs**: Available in Supabase dashboard (Functions > Logs)
- **Metrics**: Execution time, error rate (dashboard)
- **Debugging**: Console.log output visible in logs

### Lambda Functions

- **CloudWatch Logs**: `aws logs tail /aws/lambda/grammr-morphology --follow`
- **Metrics**: Invocations, duration, errors, throttles
- **Alarms**: Terraform example:

```hcl
resource "aws_cloudwatch_metric_alarm" "morphology_errors" {
  alarm_name          = "grammr-morphology-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  dimensions = {
    FunctionName = aws_lambda_function.morphology.function_name
  }
}
```

---

## Future Enhancements (Post-MVP)

1. **Rate Limiting**: Implement per-user request quotas (Supabase or middleware)
2. **Caching**: Redis or Supabase Vectors for frequently analyzed text
3. **Async Processing**: Supabase Vector Jobs or Step Functions for long-running operations
4. **Multi-Region**: Replicate Supabase and Lambda to multiple AWS regions
5. **Cost Optimization**: Lambda reserved/provisioned concurrency for Python services

---

## Glossary

- **RLS**: Row-Level Security; PostgreSQL policies that enforce user isolation at the database level
- **JWT**: JSON Web Token; stateless authentication token issued by Supabase
- **CORS**: Cross-Origin Resource Sharing; browser mechanism for allowing requests across domains
- **Edge Function**: Supabase serverless function; runs on Deno runtime with built-in Postgres client
- **Lambda**: AWS serverless function; auto-scales based on demand
- **ECR**: Elastic Container Registry; AWS service for storing Docker images
- **SAM**: Serverless Application Model; infrastructure-as-code for Lambda + API Gateway
