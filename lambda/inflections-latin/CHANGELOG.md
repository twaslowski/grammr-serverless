# Changelog

## [0.4.0](https://github.com/twaslowski/grammr-serverless/compare/v0.3.1...v0.4.0) (2026-11-25)


### Features

* automatically assign appropriate decks to users when they select a target language ([639907d](https://github.com/twaslowski/grammr-serverless/commit/639907d8c976677453a836d8e9c5c878f8e5062a))
* bake models into inflection images at build-time ([0a7d30d](https://github.com/twaslowski/grammr-serverless/commit/0a7d30de8426b33c3d46f55028a8522d2f36d2b7))
* create code for preprocessing russian sentences for A1 level flashcards ([c134192](https://github.com/twaslowski/grammr-serverless/commit/c13419221469c514fc335bedd2c79984580161a2))
* deploy v0.3.1 of romance inflector, v0.2.1 of morphology, create shared dashboard ([ac7a407](https://github.com/twaslowski/grammr-serverless/commit/ac7a4071eb2e2f665f3b77efd767592f340ebcff))
* **inf-l:** deploy lambdas for spanish, italian and portuguese behind api gateway ([9ed7f54](https://github.com/twaslowski/grammr-serverless/commit/9ed7f54b8d058cb3073b0a2cbc96e7b8333a90d6))
* **inf-l:** extract language code from request path to keep request body consistent ([5c25b9c](https://github.com/twaslowski/grammr-serverless/commit/5c25b9c1809da2a739af2932580a81ad93a8df40))
* **inflections:** distinguish inherent from inflectional gender ([68c61a8](https://github.com/twaslowski/grammr-serverless/commit/68c61a8b5ce7c1ee2959229c7dc83f8212ddc4f7))
* run inflections-latin as flask webserver ([3d8db1a](https://github.com/twaslowski/grammr-serverless/commit/3d8db1a2a366954019c953b8f8838457be685183))
* support creating more complex flashcards ([cef5099](https://github.com/twaslowski/grammr-serverless/commit/cef50993abbe407f1301f656c83726194ee878a6))


### Bug Fixes

* **ci:** bump lambda python versions, ci action versions ([b3bc7de](https://github.com/twaslowski/grammr-serverless/commit/b3bc7de69975c45bb72cdaa3c012bf1806a7c3b9))
* cleanly map verbecc.Conjugation objects to Inflection domain objects ([d781a17](https://github.com/twaslowski/grammr-serverless/commit/d781a17a12472dcca4f679cd38cc6d08511e70fe))
* **inflections:** return 400 for a malformed request body, not 500 ([f93442a](https://github.com/twaslowski/grammr-serverless/commit/f93442abce1a236fcf6aee5015cb7a538a96b144))
* overwrite default verbecc logging config to disable file logging ([dfeada4](https://github.com/twaslowski/grammr-serverless/commit/dfeada425550107efa72a6974d5dabe64ea129b4))
* paths in release-please monorepo setup ([09f878e](https://github.com/twaslowski/grammr-serverless/commit/09f878e60d62ad6b4761bf786fcada2628f4324d))

## 0.3.0 (2026-01-24)


### Features

* bake models into inflection images at build-time ([0a7d30d](https://github.com/twaslowski/grammr-serverless/commit/0a7d30de8426b33c3d46f55028a8522d2f36d2b7))
* **inf-l:** deploy lambdas for spanish, italian and portuguese behind api gateway ([9ed7f54](https://github.com/twaslowski/grammr-serverless/commit/9ed7f54b8d058cb3073b0a2cbc96e7b8333a90d6))
* **inf-l:** extract language code from request path to keep request body consistent ([5c25b9c](https://github.com/twaslowski/grammr-serverless/commit/5c25b9c1809da2a739af2932580a81ad93a8df40))
* run inflections-latin as flask webserver ([3d8db1a](https://github.com/twaslowski/grammr-serverless/commit/3d8db1a2a366954019c953b8f8838457be685183))


### Bug Fixes

* cleanly map verbecc.Conjugation objects to Inflection domain objects ([d781a17](https://github.com/twaslowski/grammr-serverless/commit/d781a17a12472dcca4f679cd38cc6d08511e70fe))
* overwrite default verbecc logging config to disable file logging ([dfeada4](https://github.com/twaslowski/grammr-serverless/commit/dfeada425550107efa72a6974d5dabe64ea129b4))
* paths in release-please monorepo setup ([09f878e](https://github.com/twaslowski/grammr-serverless/commit/09f878e60d62ad6b4761bf786fcada2628f4324d))
