# grammr

**A modular language learning platform focused on grammar mastery through sentence translation, morphological analysis,
and spaced repetition.**

grammr helps language learners understand and apply grammatical concepts across multiple languages. Create flashcards
with sentences in your target language, get instant translations with grammatical breakdowns, analyze word morphology,
and generate inflected forms—all while using a scientifically-backed spaced repetition system to reinforce learning.

## Features

- 🌍 **Multi-Language Support**: Spanish, Italian, French, Portuguese, Romanian, Russian, and more
- 📝 **Sentence & Literal Translation**: Context-aware translation preserving grammatical structure
- 🔬 **Morphological Analysis**: Deep grammatical analysis using spaCy models (tense, case, number, gender, etc.)
- 🔄 **Inflection Generation**: Generate all forms of verbs, nouns, and adjectives
- 🃏 **Smart Flashcards**: Spaced repetition system (FSRS algorithm) for optimal learning
- 🎤 **Text-to-Speech**: Native pronunciation using AWS Polly
- 🏗️ **Modular Architecture**: Use any component as a standalone microservice

## Architecture

The system is composed of three main layers:

1. **Frontend**: Next.js application (React 19, TypeScript, Tailwind CSS)
2. **Backend**: Next.js API routes + AWS Lambda functions for NLP operations
3. **Infrastructure**: Fully automated with Terraform

**Hosting:**

- Frontend: Vercel
- Database: PostgreSQL (Supabase/managed instance)
- NLP Services: AWS Lambda + API Gateway

All infrastructure is managed as code using Terraform, making deployment reproducible and version-controlled.

## Lambda Microservices

The heart of grammr's NLP capabilities are modular, independently deployable Lambda functions in the `lambda/`
directory. Each service can be used standalone via the API Gateway.

### Available Services

| Service               | Description                                                                        | Languages                                      | Technology        |
|-----------------------|------------------------------------------------------------------------------------|------------------------------------------------|-------------------|
| **morphology**        | Grammatical analysis of words (POS tagging, lemmatization, morphological features) | Multi-language (via spaCy models)              | Python, spaCy     |
| **inflections-latin** | Verb conjugation for Romance languages                                             | Spanish, Italian, French, Portuguese, Romanian | Python, verbecc   |
| **inflections-ru**    | Verb conjugation and noun declension for Russian                                   | Russian                                        | Python, pymorphy2 |
| **translate**         | Context-aware translation with grammatical preservation                            | Multi-language                                 | Python, DeepL API |
| **tts**               | Text-to-speech with natural voices                                                 | Multi-language                                 | Python, AWS Polly |
| **authorizer**        | API Gateway authentication                                                         | N/A                                            | Python            |

### Service Architecture

Each Lambda function is:

- **Self-contained**: Own dependencies, tests, and documentation
- **Docker-based**: Containerized for consistent builds and large dependencies (e.g., spaCy models)
- **API-first**: RESTful interface via AWS API Gateway
- **Language-specific**: Optimized models and libraries per language

### Example: Morphology Service

The morphology service analyzes text and returns detailed grammatical information:

```bash
# Request
POST /morphology/en
{
  "text": "The cats were running quickly"
}

# Response
{
  "tokens": [
    {
      "text": "cats",
      "lemma": "cat",
      "pos": "NOUN",
      "morph": {
        "Number": "Plur"
      }
    },
    {
      "text": "were running",
      "lemma": "run",
      "pos": "VERB",
      "morph": {
        "Aspect": "Prog",
        "Tense": "Past"
      }
    }
    // ...
  ]
}
```

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **pnpm**: Required package manager (not npm/yarn)
- **Docker**: For local database and Lambda development
- **Supabase CLI**: For local database management
- **Terraform**: For infrastructure deployment (optional)
- **AWS CLI**: For Lambda deployment (optional)

### Quick Start (Frontend Only)

Run the frontend with a local database:

```bash
# Install dependencies
pnpm install

# Start local database
supabase start

# Run development server
pnpm dev
```

The application will be available at `http://localhost:3000`.

**Note:** This runs the frontend only. NLP services (translation, morphology, etc.) require deploying Lambda functions
to AWS.

### Full Stack Setup

To run with all NLP capabilities:

1. **Set up AWS resources** (one-time):
   ```bash
   cd terraform/bootstrap
   terraform init
   terraform apply
   
   cd ../shared
   terraform init
   terraform apply
   ```

2. **Build and deploy Lambda functions**:
   ```bash
   # Example: Build morphology service
   cd lambda/morphology
   docker build --build-arg SPACY_MODEL=en_core_web_sm -t morphology:latest .
   
   # Push to ECR (created by Terraform)
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker tag morphology:latest <account>.dkr.ecr.us-east-1.amazonaws.com/grammr/morphology:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/grammr/morphology:latest
   ```

3. **Deploy infrastructure**:
   ```bash
   cd terraform/application
   terraform init -backend-config=config/dev.hcl
   terraform apply -var-file=config/dev.tfvars
   ```

4. **Configure frontend**:
   Create `.env.local`:
   ```bash
   DATABASE_URL=postgresql://...
   API_GW_URL=https://your-api-gateway.execute-api.us-east-1.amazonaws.com
   API_GW_API_KEY=your-api-key
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

5. **Run the application**:
   ```bash
   pnpm dev
   ```

**Alternative:** Use the Taskfile for common workflows:

```bash
task run          # Start database and dev server
task apply:dev    # Deploy to dev environment
task e2e:ru       # Run E2E tests for Russian
```

## Development

### Available Scripts

```bash
# Development
pnpm dev          # Start Next.js dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server

# Code Quality
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint errors
pnpm fmt          # Format code with Prettier

# Testing
pnpm test         # Run Jest unit tests
pnpm e2e          # Run Playwright E2E tests

# Database (Drizzle ORM)
pnpm db:generate  # Generate migration files from schema
pnpm db:push      # Push schema changes to database (dev)
pnpm db:migrate   # Apply migrations (production)
pnpm db:studio    # Open Drizzle Studio (database GUI)

# Database (Supabase - Local)
supabase start    # Start local Supabase instance
supabase stop     # Stop local Supabase instance
supabase status   # Check status and get credentials
```

## Testing

### Unit Tests (Jest)

Run fast, isolated tests for business logic:

```bash
pnpm test              # Run all tests
pnpm test -- --watch   # Watch mode
pnpm test -- --coverage # With coverage report
```

Tests are co-located with source files or in `src/lib/test/`.

### End-to-End Tests (Playwright)

Test complete user workflows across multiple languages:

```bash
pnpm e2e                          # Run all E2E tests
pnpm e2e -- --ui                  # Interactive UI mode
pnpm e2e -- --project=chromium-ru # Test Russian language
pnpm e2e -- --headed              # Run with visible browser
```

**Supported test languages:** `ru`, `it`, `fr`, `es`, `pt`

Tests are in `e2e/tests/`:

- `flashcards.spec.ts` - Flashcard creation and management
- `inflections.spec.ts` - Inflection generation
- `translations.spec.ts` - Translation features

### Lambda Function Tests

Each Lambda has its own test suite:

```bash
cd lambda/morphology
source .venv/bin/activate
uv run pytest                 # Run tests
uv run pytest --cov           # With coverage
uv run pytest -v              # Verbose output
```

## Deployment

### Frontend (Vercel)

The frontend is automatically deployed to Vercel on push to `main`:

```bash
git push origin main
```

Configure environment variables in the Vercel dashboard.

### Infrastructure (Terraform)

Deploy AWS resources:

```bash
cd terraform/application

# Initialize (first time)
terraform init -backend-config=config/dev.hcl

# Plan changes
terraform plan -var-file=config/dev.tfvars

# Apply changes
terraform apply -var-file=config/dev.tfvars
```

**Environments:**

- `dev` - Development environment
- `prod` - Production environment

Each environment has its own:

- Lambda functions
- API Gateway
- CloudWatch log groups
- Environment-specific configuration

### Lambda Updates

After changing Lambda code:

1. **Build new Docker image**:
   ```bash
   cd lambda/morphology
   docker build --build-arg SPACY_MODEL=en_core_web_sm -t morphology:0.2.0 .
   ```

2. **Push to ECR**:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   docker tag morphology:0.2.0 <account>.dkr.ecr.us-east-1.amazonaws.com/grammr/morphology:0.2.0
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/grammr/morphology:0.2.0
   ```

3. **Update Terraform**:
   Edit `terraform/application/locals.tf` to reference the new image tag, then:
   ```bash
   terraform apply -var-file=config/dev.tfvars
   ```

## Database

### Schema Management

The project uses **Drizzle ORM** for type-safe database operations:

```typescript
// Define schemas in src/db/schemas/
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: varchar("name", {length: 255}),
});

// Use in application
import {db} from "@/db/connect";
import {users} from "@/db/schemas";

const allUsers = await db.select().from(users);
```

### Migrations

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply to local database
pnpm db:push

# Apply to production (via migration files)
pnpm db:migrate
```

**Note:** Legacy migrations in `supabase/migrations/` are still the current source of truth. New migrations are managed
via Drizzle.

## API Documentation

### Next.js API Routes

Internal API routes at `/api/v1/*`:

- `GET /api/v1/flashcards` - List flashcards
- `POST /api/v1/flashcards` - Create flashcard
- `GET /api/v1/flashcards/decks` - List decks
- `POST /api/v1/flashcards/decks` - Create deck
- `GET /api/v1/study` - Get study session
- `POST /api/v1/study/review` - Submit review

All routes use authentication and Zod validation.

### Lambda API (via API Gateway)

External NLP services at `API_GW_URL`:

- `POST /morphology/{language}` - Analyze text morphology
- `POST /inflections/{language}` - Generate word inflections
- `POST /translate` - Translate text
- `POST /tts` - Generate speech from text

Requires API key authentication (`x-api-key` header).

## Contributing

This is a personal project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test && pnpm e2e`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please ensure:

- All tests pass
- Code is formatted (`pnpm fmt`)
- No linting errors (`pnpm lint`)
- E2E tests cover new features

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Database**: PostgreSQL, Drizzle ORM
- **Auth**: Supabase Auth (transitioning to custom solution)
- **NLP**: spaCy, pymorphy2, verbecc, DeepL
- **Infrastructure**: AWS Lambda, API Gateway, ECR, CloudWatch
- **IaC**: Terraform
- **Testing**: Jest, Playwright, pytest
- **Deployment**: Vercel (frontend), AWS (backend)

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE.txt](LICENSE.txt) file
for details.

All code in this repository, including the NLP modules, is open source under GPL-3.0.

## Support

- **Issues**: Open an issue on GitHub
- **Email**: `contact@grammr.app`
- **Documentation**: See `docs/` directory for detailed specifications

If you're interested in using grammr's NLP services as standalone microservices or want to contribute to the project,
feel free to reach out!
