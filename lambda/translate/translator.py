import json
import os
from abc import ABC, abstractmethod

import boto3
import deepl
from openai import OpenAI


class Translator(ABC):
    pass

    @abstractmethod
    def translate(
        self, text: str, source_language: str, target_language: str, context: str
    ) -> str:
        """
        Abstract method to translate text into a target language, potentially using context.
        :param text: Text to translate. Expected to be only a single word if context is provided.
        :param source_language: Language of the input text
        :param target_language: Language to translate the text into
        :param context: A contextual phrase to help disambiguate the meaning of the word
        :return:
        """
        pass


class DeepLTranslator(Translator):
    """
    DeepL Translator using the DeepL API.
    Requires DeepL API key for initialization.
    """

    def __init__(self):
        api_key = os.getenv("DEEPL_API_KEY")
        if not api_key:
            raise ValueError("DeepL API key not found in environment variables")

        self.client = deepl.DeepLClient(api_key)

    def translate(
        self, text: str, _source_language: str, target_language: str, _context: str
    ) -> str:
        """
        Translate text using DeepL API. Does not consider context.
        :param text: Text to translate
        :param _source_language: source_language, not used.
        :param target_language: Language to translate the text into
        :param _context: context, not used.
        :return:
        """
        return self.client.translate_text(text, target_lang=target_language).text


class AWSTranslator(Translator):
    """
    AWS Translator using the AWS Translate service.
    Requires AWS credentials to be configured with at least translate:TranslateText permission.
    """

    def __init__(self):
        self.client = boto3.client("translate")

    def translate(
        self, text: str, source_language: str, target_language: str, _context: str
    ) -> str:
        """
        Translate text using AWS Translate. Does not consider context.
        :param text: Text to translate
        :param source_language: Language of the input text
        :param target_language: Language to translate the text into
        :param _context: context, not used.
        :return:
        """
        response = self.client.translate_text(
            Text=text,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_language,
        )
        return response["TranslatedText"]


class OpenAITranslator(Translator):
    """
    OpenAI Translator using the OpenAI API.
    Requires OpenAI API key for initialization.

    Differentiates itself from the other two in that it accepts an additional context parameter
    to provide more nuanced translations based on the provided context.
    """

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key not found in environment variables")

        self.openai = OpenAI(api_key=api_key)

        # I have considered using the Structured Output feature of OpenAI to enforce JSON output,
        # but that requires Pydantic to be installed, which can sometimes be messy in the Lambda runtime.
        # Might want to look into refactoring later to reduce token usage and improve reliability.
        self.system_prompt = """
        You are a language expert providing literal word translations.
        Given a phrase in and a specific word from that phrase, provide the literal translation of that word into {target_language}.
        Consider the context of the phrase to provide the most accurate translation for how the word is used.
        Respond ONLY with a JSON object in this exact format: {{"translation": "literal translation of the word"}}
        Do not include any other text, explanations, or formatting.
        """

        self.user_prompt = """
            Phrase: "{}"
            Word to translate: "{}"`
        """
        self.model = "gpt-4.1-nano"

    def translate(
        self, word: str, _source_language: str, target_language: str, context: str
    ) -> str:
        """
        Designed to translate a single word within a given context to disambiguate meaning.
        :param word: A single word in any given language
        :param _source_language: source_language, not used.
        :param target_language: The language to translate the word into
        :param context: The context in which the word is used
        :return:
        """
        response = self.openai.responses.create(
            model=self.model,
            instructions=self.system_prompt.format(target_language=target_language),
            input=self.user_prompt.format(context, word),
            store=False,
        )
        return json.loads(response.output_text)
