-We're creating a rudimentary translation system.
The page will be laid out as follows:

a) There is an input box where the user can enter text.
b) By default, the translation mode is `profile.target_language` to `profile.source_language`.
This can be reversed with a button.
c) There is a button to submit the text for translation.
d) Below the input box, there is an area where the translated text will be displayed.
e) The translated text is interactive: clicking a word will trigger a pop-up/modal that shows the literal translation of the word.

The translation functionality is implemented via Next.js API routes that call the OpenAI API directly:
`/api/translations/phrase` and `/api/translations/word`.

The phrase translation route receives the source_language, target_language, and text as parameters and returns a translated
phrase.
It does so by utilizing the OpenAI API. This can be changed to DeepL or another service later;
however, the word translation will most likely always be LLM-based (OpenAI initially),
therefore it makes sense to keep both routes using the same service for simplicity initially.

Both routes require authentication via Supabase and the `OPENAI_API_KEY` environment variable to be set.

Request body example:

```
{
  "text": "Hello, how are you?",
  "source_language": "en",
  "target_language": "es"
}
```

Response body example:

```
{
  "text": "Hello, how are you?",
  "source_language": "en",
  "target_language": "es",
  "translation": "Hola, ¿cómo estás?"
}
```

`literal-translation` receives `source_language`, `target_language`, `phrase` and `word` as parameters and
returns a literal translation of the phrase and word:

Request body example:

```
{
  "phrase": "example phrase",
  "word": "example",
  "source_language": "en",
  "target_language": "es"
}
```

Response body example:

```
{
  "phrase": "example phrase",
  "word": "example",
  "source_language": "en",
  "target_language": "es",
  "translation": "ejemplo"
}
```

When interacting with an LLM, responses should always be in JSON format, and the response should be parsed accordingly.
However, not the entire response body has to be requested; only the `translation` field is necessary for display purposes.
l

---

## Clarification Questions

Before implementing, the following questions need to be answered:

### Q1: UI Component for Word Pop-ups

Should I use Radix UI Popover for the word click pop-ups (consistent with existing shadcn/ui components), or a different approach like a modal/tooltip?

**Answer:** Use Radix UI Popover.

### Q2: Input Type

For text input, should I use a multi-line textarea (better for longer phrases/sentences) or a single-line input?

**Answer:** Use a multi-line textarea.

### Q3: OpenAI Model

Which OpenAI model should be used for the translation edge functions? Options include:

- `gpt-4o-mini` (faster, cheaper)
- `gpt-4o` (better quality)

**Answer:** Use gpt-4o-mini initially.

### Q4: Error Handling Display

How should translation errors be displayed to the user? Options:

- Inline error message below the input
- Toast notification
- Both

**Answer:** Error handling should occur via an error field that is displayed persistently below the text input field.

### Q5: Loading States

Should there be loading spinners/indicators while waiting for:
a) Phrase translations?
b) Word literal translations (when clicking a word)?

**Answer:** While waiting for phrase translation, display a loading placeholder. Word translations should be fetched ad-hoc when a word is clicked on; then a loading screen should be displayed while the word translation is being awaited.

### Q6: Profile Context

The dashboard layout already fetches the user profile but doesn't pass it to children. Should I:
a) Fetch the profile again in the translate page (simpler, but duplicate fetch)
b) Modify the layout to pass profile data via React context

**Answer:** Fetch the profile information on the translate page first; we can always introduce a shared context later.

---

## Implementation Documentation

### Overview

The translation feature allows users to translate text between their configured source and target languages. Users can also click on individual words in the translated text to see their literal translations in context.

### Frontend Components

#### `src/components/translation/translation-form.tsx`

Main translation form component that:

- Displays a multi-line textarea for text input
- Shows source and target language with a swap button to reverse direction
- Displays a persistent error message below the input when translation fails
- Shows a loading placeholder while waiting for phrase translation
- Renders the translation result when available

Props:

- `profile: Profile` - User profile containing `source_language` and `target_language`

Features:

- Default direction: `target_language` → `source_language` (learning the target language)
- Ctrl+Enter keyboard shortcut for quick translation
- Language swap button to reverse translation direction

#### `src/components/translation/translation-result.tsx`

Displays the translated text with interactive words:

- Splits translated text into words while preserving whitespace and punctuation
- Renders each word as a `TranslatedWord` component
- Passes swapped language parameters (source becomes target for word translation)

Props:

- `translatedText: string` - The translated phrase
- `sourceLanguage: string` - Original source language code
- `targetLanguage: string` - Original target language code

#### `src/components/translation/translated-word.tsx`

Interactive word component using Radix UI Popover:

- Displays a card-like popover window on click for better information display
- Fetches literal translation on-demand when the word is clicked
- Shows loading state while translation is pending
- Displays error messages if translation fails
- Strips punctuation from words before sending to the translation API

Key features:

- Uses `stripPunctuation()` helper to extract clean words for translation
- Caches translation result to avoid redundant API calls
- Popover has sections for word details with room for future expansion (e.g., grammar info, examples)

Punctuation stripping:

- Uses regex `/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu` to strip leading/trailing non-letter/non-number characters
- Preserves punctuation in the displayed text while sending clean words to the API

#### `src/components/translation/index.ts`

Barrel file exporting all translation components:

- `TranslationForm`
- `TranslationResult`
- `TranslatedWord`

### Page

#### `src/app/dashboard/translate/page.tsx`

Server component that:

- Fetches the authenticated user
- Fetches the user's profile with language preferences
- Renders the `TranslationForm` with the profile data
- Redirects to login if not authenticated
- Throws error if profile fetch fails

### Type Definitions

#### `src/types/translation.ts`

Zod schemas and TypeScript types for:

- `PhraseTranslationRequest` - Request for phrase translation
- `PhraseTranslationResponse` - Response from phrase translation
- `LiteralTranslationRequest` - Request for word translation (includes phrase for context)
- `LiteralTranslationResponse` - Response from word translation

### Library Functions

#### `src/lib/translation.ts`

Client-side functions for invoking Supabase Edge Functions:

- `translatePhrase(request)` - Invokes `phrase-translation` edge function
- `translateWord(request)` - Invokes `literal-translation` edge function

Both functions:

- Use the Supabase client to invoke functions
- Handle errors from the edge function
- Return typed responses

### Supabase Edge Functions

#### `supabase/functions/phrase-translation/index.ts`

Translates complete phrases using OpenAI:

- Model: `gpt-4o-mini`
- Temperature: 0.3 (for consistent translations)
- Uses JSON response format
- CORS enabled for browser access

Request body:

```json
{
  "text": "Hello, how are you?",
  "source_language": "en",
  "target_language": "es"
}
```

Response body:

```json
{
  "text": "Hello, how are you?",
  "source_language": "en",
  "target_language": "es",
  "translation": "Hola, ¿cómo estás?"
}
```

#### `supabase/functions/literal-translation/index.ts`

Translates individual words with phrase context using OpenAI:

- Model: `gpt-4o-mini`
- Temperature: 0.3
- Uses JSON response format
- Considers phrase context for accurate word translation

Request body:

```json
{
  "phrase": "example phrase",
  "word": "example",
  "source_language": "en",
  "target_language": "es"
}
```

Response body:

```json
{
  "phrase": "example phrase",
  "word": "example",
  "source_language": "en",
  "target_language": "es",
  "translation": "ejemplo"
}
```

### Error Handling

- **Phrase translation errors**: Displayed in a persistent error box below the textarea
- **Word translation errors**: Displayed within the word popover
- Both use destructive styling to clearly indicate errors
