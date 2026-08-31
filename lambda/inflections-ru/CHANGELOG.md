# Changelog

## [0.2.0](https://github.com/twaslowski/grammr-serverless/compare/v0.1.7...v0.2.0) (2026-08-31)


### Features

* add inflections-ru lambda, api gateway; improve error handling ([93e2569](https://github.com/twaslowski/grammr-serverless/commit/93e25698145853d6c20e4b8c868ce8bb4bcd1373))
* add language field to morphological analysis, change source_phrase -&gt; text ([2912549](https://github.com/twaslowski/grammr-serverless/commit/291254987f470add2b3ac12d669503f9b0996d41))
* add openapi docs; version apis ([95ba464](https://github.com/twaslowski/grammr-serverless/commit/95ba46494c6a2f3d2107629654d7a29951787b59))
* add q&a section, privacy policy, license ([8c18041](https://github.com/twaslowski/grammr-serverless/commit/8c18041e419017fff794a22a9ffb44901aa494cb))
* create inflection lambda ([a197c06](https://github.com/twaslowski/grammr-serverless/commit/a197c06849a72cd4afc5804abe2f993971f4115a))
* create inflections page ([5a11ee6](https://github.com/twaslowski/grammr-serverless/commit/5a11ee61884e757181ce358a39c20d6d286def6c))
* **inflections:** distinguish inherent from inflectional gender ([68c61a8](https://github.com/twaslowski/grammr-serverless/commit/68c61a8b5ce7c1ee2959229c7dc83f8212ddc4f7))
* refactor inflection-ru lambda, add confidence and POS agreement check ([b7e2299](https://github.com/twaslowski/grammr-serverless/commit/b7e2299cdb476157254f4e5aab4089b139b6d7eb))
* support creating more complex flashcards ([cef5099](https://github.com/twaslowski/grammr-serverless/commit/cef50993abbe407f1301f656c83726194ee878a6))


### Bug Fixes

* **ci:** bump lambda python versions, ci action versions ([b3bc7de](https://github.com/twaslowski/grammr-serverless/commit/b3bc7de69975c45bb72cdaa3c012bf1806a7c3b9))
* error handling and logging in inflection-ru lambda ([13dbcf0](https://github.com/twaslowski/grammr-serverless/commit/13dbcf0d137b2fb19ec29f75b555861f2c6268f3))
* handle invalid request bodies more gracefully ([6a50afa](https://github.com/twaslowski/grammr-serverless/commit/6a50afa1292d0d5dc3e3ba28459c0be38685fd68))
* handle invalid request bodies more gracefully ([f99f223](https://github.com/twaslowski/grammr-serverless/commit/f99f2233cd731906005c672f72bbbe5b06523118))
* inflections-ru lambda logging ([568916c](https://github.com/twaslowski/grammr-serverless/commit/568916c405fd34e33a0a44999c9882b2a0f20173))
* **inflections:** return 400 for a malformed request body, not 500 ([f93442a](https://github.com/twaslowski/grammr-serverless/commit/f93442abce1a236fcf6aee5015cb7a538a96b144))
