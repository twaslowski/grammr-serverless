import json
import logging
import os
import sys
import datetime

import deepl
import requests

api_gw_base_url = os.environ["API_GW_URL"]
deepl_auth_key = os.environ['DEEPL_API_KEY']

_deepl_client = deepl.DeepLClient(deepl_auth_key)

_logger = logging.getLogger()
logging.basicConfig(level=logging.INFO)
logging.getLogger("deepl").setLevel(level=logging.WARN)


def main(language: str):
    with open(f"{language}.txt", "r", encoding="utf-8") as f, open(
        f"{language}.json", "w", encoding="utf-8"
    ) as t:
        lines = f.readlines()
        import_file_data = {
            "version": "1.0",
            "exported_at": datetime.datetime.now().isoformat(),
            "flashcards": []
        }
        for idx, line in enumerate(lines[:2]):
            # General flashcard data
            flashcard = {"front": line.strip(), "notes": "", "deck_name": "Default Deck"}

            # Back data and morphology
            back = {"type": "analysis", "source_phrase": line.strip()}
            back.update(retrieve_morphology(line, language))

            # add translation
            try:
                translation = retrieve_translation(line)
                back["translation"] = translation
            except Exception as e:
                _logger.error("Got exception: %s", e)
                continue

            # Fetch inflections for each token, where applicable
            for token in back["tokens"]:
                if token["pos"] in ["NOUN", "ADJ", "VERB", "AUX"]:
                    inflections = retrieve_inflections(
                        token["text"], token["pos"], language
                    )
                    # If call was successful, enrich Token
                    if inflections and not inflections.get("error"):
                        token["paradigm"] = inflections
                        _logger.debug("Got inflections: %s", inflections)

            flashcard["back"] = back
            import_file_data["flashcards"].append(flashcard)

            if idx % 10 == 0:
                _logger.info("Progress: %s/%s", idx, len(lines))

        t.write(f"{json.dumps(import_file_data)}\n")


def retrieve_morphology(phrase: str, language: str) -> dict:
    response = requests.post(
        f"{api_gw_base_url}/morphology/{language}",
        json={"phrase": phrase},
        headers={"Content-Type": "application/json"},
    )
    _logger.debug(
        "Response status=%s payload=%s",
        response.status_code,
        response.json(),
    )
    return response.json()


def retrieve_inflections(word: str, pos: str, language: str) -> dict:
    response = requests.post(
        f"{api_gw_base_url}/inflections/{language}",
        json={"lemma": word, "pos": pos},
        headers={"Content-Type": "application/json"},
    )
    _logger.debug(
        "Response status=%s payload=%s",
        response.status_code,
        response.json(),
    )
    return response.json()

def retrieve_translation(phrase: str, target_lang: str = "EN-US") -> str:
    return _deepl_client.translate_text(phrase, target_lang=target_lang).text


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise ValueError(
            "Usage: main.py <language>; expects <language>.txt to be present"
        )
    lang = sys.argv[1]
    main(lang)
