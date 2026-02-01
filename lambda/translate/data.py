from enum import Enum
from typing import Optional

valid_languages = ["de", "en", "es", "fr", "it", "pt", "ru"]


class TranslationEngine(Enum):
    AWS = "aws"
    DEEPL = "deepl"
    OPENAI = "openai"


class Request:
    text: str
    source_language: str
    target_language: str
    translation_engine: TranslationEngine
    context: Optional[str] = None

    def __init__(
        self,
        text: str,
        source_language: str,
        target_language: str,
        translation_engine: TranslationEngine,
        context: Optional[str] = None,
    ):
        if not text:
            raise ValueError("Text cannot be empty")

        if not source_language or not target_language:
            raise ValueError("Source and target languages must be provided")

        if (
            source_language not in valid_languages
            or target_language not in valid_languages
        ):
            raise ValueError("Invalid source or target language")

        if context and len(text.split(" ")) > 1:
            raise ValueError(
                "Context can only be provided for single-word translations"
            )

        self.text = text
        self.source_language = source_language
        self.target_language = target_language
        self.context = context
        self.translation_engine = translation_engine
