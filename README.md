# grammr

grammr is a language learning tool focused on grammar practice through sentence translation.
Using morphological analysis and inflection generation, it helps users understand and apply grammatical concepts
in various languages. It allows users to create flashcards with sentences in a target language, providing
translations, grammatical breakdowns, and inflected forms to aid in learning.

## Components

- **Sentence Translation**: Translate sentences between languages while preserving grammatical structure.
- **Morphological Analysis**: Analyze words to identify their grammatical components (e.g., tense, case, number).
- **Inflection Generation**: Generate different inflected forms of words based on grammatical rules.
- **Flashcard System**: A flashcard system with spaced repetition to help users memorize sentences and their grammatical
  structures.

These components are hosted on Vercel, Supabase and AWS. Infrastructure is entirely managed with Terraform.
The system is highly modular, and you may use different components, like the morphological analysis engine
or the translator that enables in-context word translation, among other things, as standalone services.

The NLP modules can be found in the `lambda/` directory. All code in this repository is licensed under the
GPL-3.0 License.

## Building and Deployment

You can easily run the project locally with a few commands:

```shell
supabase start  # to run the database
pnpm dev  # to run the frontend
```

However, for the sake of my sanity, I opted not to emulate the API Gateway and Lambdas locally.
Therefore, if you are interested in running the full stack locally, you will need to deploy the Lambdas
to AWS first. For this you will have to apply the `shared` and `application` Terraform stacks.

Truth be told, this is not trivial, and I will not invest time into making this easy while this project has
no users and no stars. If you are genuinely interested in this project, reach out at `contact@grammr.app` and
I'll be happy to sit down and figure something out with you.