# End-to-End Testing with Playwright

## Overview

This project uses Playwright for end-to-end testing against the local development instance.

## Test Scenarios

### Scenario 1: User Signup Flow

1. Sign up a new user
2. Select language preference
3. Verify user can access the dashboard

### Scenario 2: Inflections Page

1. Navigate to the inflections page
2. Input a word
3. Verify the inflections table is retrieved and displayed

**Prerequisite:** User must be logged in with complete profile information.

## Authentication Strategy

Use Playwright's `storageState` to share authentication across tests:

- Run a setup script that performs signup and profile completion once
- Save the authentication state to `.auth/user.json`
- Subsequent tests reuse this state, avoiding repeated signup flows
- Tests remain independent and can run in parallel

## Implementation Approach

### Project Structure

e2e/
├── auth.setup.ts # Authentication setup (runs first)
├── tests/
│ ├── signup.spec.ts # Scenario 1: Signup flow
│ └── inflections.spec.ts # Scenario 2: Inflections page
└── .auth/
└── user.json # Saved authentication state (gitignored)

### Configuration

Configure `playwright.config.ts` with:

- A `setup` project for authentication
- A `tests` project that depends on `setup` and uses the saved `storageState`

### Test Independence

- Scenario 1 (signup) can be part of the setup or a standalone test
- Scenario 2 (inflections) uses saved auth state and runs independently
- No sequential dependency between test files

## Target Environment

- Run against local development instance
- Framework: React (TypeScript)
