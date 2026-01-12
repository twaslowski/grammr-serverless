# grammr-serverless

This is a rewrite of the previous iteration of grammr, designed to run as a serverless application.
The goal is to provide a scalable and cost-effective solution for grammar checking and text analysis.

The frontend runs on Vercel; Supabase is used for authentication and as a database;
and certain functionalities are implemented as Supabase Edge functions and AWS Lambdas.

## Components

- Frontend: NextJS application hosted on Vercel
- Translation APIs: Edge Functions
- Morphological analysis and inflections: AWS Lambda functions

Deployment is therefore not straightforward. Instructions for deploying:

- Database: `supabase db push`
- Edge functions: `supabase functions deploy <function-name>`
- AWS Lambdas: Terraform
- Frontend: Vercel Git integration
- Docker images: Currently built manually

## Weak points

- Environments have to be structured more clearly: What are dev and prod, and which resources can be available where?
  Which are shared, which are separate? Design Terraform modules accordingly.
- Docker images are built manually; need to automate this with CI/CD. Use release-please.
- Also: CI/CD for Supabase Edge functions and database migrations.
- Authenticate Edge functions
