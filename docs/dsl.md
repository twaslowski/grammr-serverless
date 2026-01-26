# Domain-Specific Language

This page briefly outlines the linguistic terms used across the codebase.

## Linguistics

I'm not a linguist by trade, nor do I have a deep understanding of the literature.
My definitions may not be perfect. If you're a linguist and have some notes for me, please do reach out or open an
issue.

The following definitions are sourced from Janda and Tyers (2018), who themselves have a wider range of sources
that I could not be bothered to double-check. I'll amend this article when I have time to read through some books
and papers on the topic. With that out of the way, let's get into the definitions.

### Lexemes

As Wikipedia states, a Lexeme is "a unit of lexical meaning that underlies a set of words that are related
through inflection."
I don't use the term "lexeme" a lot throughout the codebase, but I do use the term "paradigm" a fair bit, which is
defined through its relationship to a lexeme.

As Janda and Tyers state: "[A lexeme is] an abstraction that unifies a set of inflectionally-related word forms. [...]
Word forms are inflected forms such as [...] the forms of Russian SLOVO 'WORD' [...]: slóvo [slóvǝ], slóva [slóvǝ],
slóvu [slóvu], slóvom [slóvǝm], slóve [slóvj i], slová [slʌvá], slóv [slóf], slovám [slʌvám], slovámi [slʌvámji],
slováx [slʌváx]."

### Paradigm

As per Janda and Tyers:

"A paradigm is the set of word forms associated with a lexeme and the marking of morphosyntactic features. A full
paradigm exhausts all possible morphosyntactic features associated with the given word class [...]."

### Features

Morphosyntactic features (or properties), simply referred to as "Features" in the code, are defined as being
"part of the shared vocabulary of morphology, syntax and semantics. They serve in syntax to determine a word form’s
distribution with respect to other constituents and to regulate its relations with other parts of a sentence; in
morphology, they determine the inflectional exponents involved in a word form’s phonological
expression" [[source](https://inflectionalparadigms.as.uky.edu/chapter-3)].

For example, saying a Verb is in the "3rd person singular present tense" assigns multiple features
(person, number, tense) to it that enrich it with semantic meaning within the context it is in.

The features from [universal dependencies](https://universaldependencies.org/#language-u) are used throughout
this code. Anytime an external library (such as `pymorphy3` or `verbecc`) is used, the features and abbreviations used
in it are expected to be mapped back to universal features before returning to the core application to keep the
domain code clean.

### Parts of Speech

Quoting Wikipedia: "In grammar, a part of speech or part-of-speech (abbreviated as POS or PoS, also known as word
class or grammatical category) is a category of words (or, more generally, of lexical items) that have similar
grammatical properties". [Universal POS tags](https://universaldependencies.org/u/pos/index.html) are used throughout
the code.

### Lemma

"A lemma is the citation word form of a lexeme. The Nominative Singular slóvo 'word' is a lemma, as is the Infinitive
contar 'tell'." (Janda and Tyers, 2018)