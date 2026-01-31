import json
import logging
import os
import sys
import datetime
import csv
from typing import Any

import requests

"""
Accepts a language as an argument, e.g. python main.py ru.
Expects data/<language>.csv to be present with pipe-separated phrase|translation lines.
Creates data/<language>.json with enriched flashcard data, which can be imported via the grammr UI.
"""

api_gw_base_url = os.environ["API_GW_URL"]
deepl_auth_key = os.environ["DEEPL_API_KEY"]

_logger = logging.getLogger()
logging.basicConfig(level=logging.INFO)
logging.getLogger("urllib3.connectionpool").setLevel(level=logging.WARN)


def main(language: str, max_lines: int):
    import_file_data = {
        "version": "1.0",
        "exported_at": datetime.datetime.now().isoformat(),
        "flashcards": [],
    }
    with open(f"data/{language}.csv", "r", encoding="utf-8") as f:
        r = csv.reader(f, delimiter="|")
        for idx, line in enumerate(r):
            if max_lines is not None and idx >= max_lines:
                break

            phrase = line[0].strip()
            translation = line[1].strip()

            if not phrase or not translation:
                _logger.warning("Skipping empty line or translation at index %s", idx)
                continue

            # General flashcard data
            flashcard = _init_flashcard(phrase, translation)

            try:
                flashcard["back"].update(retrieve_morphology(phrase, language))
            except Exception as e:
                _logger.error(
                    "Skipping phrase at index %s due to morphology retrieval error: %s",
                    idx,
                    e,
                )
                continue

            # Fetch inflections for each token, where applicable
            for token in flashcard["back"]["tokens"]:
                if token["pos"] in ["NOUN", "ADJ", "VERB", "AUX"]:
                    try:
                        inflections = retrieve_inflections(
                            token["text"], token["pos"], language
                        )
                    except Exception as e:
                        _logger.error(
                            "Inflection retrieval error for token '%s' at index %s: %s",
                            token["text"],
                            idx,
                            e,
                        )
                        continue
                    # If call was successful, enrich Token
                    if inflections and not inflections.get("error"):
                        token["paradigm"] = inflections
                        _logger.debug("Got inflections: %s", inflections)

            # Enrich existing data
            import_file_data["flashcards"].append(flashcard)

            if idx % 10 == 0:
                _logger.info("Progress: %s/?", idx)

    with open(f'data/{language}.json', 'w', encoding='utf-8') as out:
        out.write(json.dumps(import_file_data, ensure_ascii=False))


def _init_flashcard(phrase: str, translation: str) -> dict[str, Any]:
    flashcard = {
        "front": phrase,
        "notes": "",
        "back": {
            "type": "analysis",
            "source_phrase": phrase,
            "translation": translation,
        },
    }
    return flashcard


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
    if response.status_code != 200:
        raise Exception("Morphology retrieval failed")
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
    if response.status_code != 200:
        raise Exception("Inflection retrieval failed")
    return response.json()


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise ValueError(
            "Usage: main.py <language>; expects <language>.txt to be present"
        )
    lang = sys.argv[1]
    max_lines = int(sys.argv[2]) if sys.argv[2] != "None" else None
    main(lang, max_lines)
