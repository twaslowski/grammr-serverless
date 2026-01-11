We're creating a rudimentary translation system.
The page will be laid out as follows:

a) There is an input box where the user can enter text.
b) By default, the translation mode is `profile.target_language` to `profile.source_language`.
This can be reversed with a button.
c) There is a button to submit the text for translation.
d) Below the input box, there is an area where the translated text will be displayed.
e) The translated text is interactive: clicking a word will trigger a pop-up/modal that shows the literal translation of the word.

The initial translation functionality will be implemented with two Supabase Edge functions:
`phrase-translation` and `literal-translation`.

`phrase-translation` receives the source_language, target_language, and text as parameters and returns a translated
phrase.
It does so by utilizing the OpenAI API. This can be changed to DeepL or another service later;
however, the `literal-translation` function will most likely always be LLM-based (OpenAI initially),
therefore it makes sense to keep both functions using the same service for simplicity initially.

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