import json
import logging
import os
import sys
import datetime
import csv

import requests

api_gw_base_url = os.environ["API_GW_URL"]
deepl_auth_key = os.environ["DEEPL_API_KEY"]

_logger = logging.getLogger()
logging.basicConfig(level=logging.INFO)
logging.getLogger("urllib3.connectionpool").setLevel(level=logging.WARN)


def main(language: str):
    with open(f"data/{language}.csv", "r", encoding="utf-8") as f, open(
        f"data/{language}.json", "w"
    ) as t:
        r = csv.reader(f, delimiter="|")
        import_file_data = {
            "version": "1.0",
            "exported_at": datetime.datetime.now().isoformat(),
            "flashcards": [],
        }
        for idx, line in enumerate(r):
            if idx == 100:
                return

            phrase = line[0].strip()
            translation = line[1].strip()

            if not phrase or not translation:
                _logger.warning("Skipping empty line or translation at index %s", idx)
                continue

            # General flashcard data
            flashcard = {
                "front": phrase,
                "notes": "",
                "deck_name": "Default Deck",
            }

            # Back data and morphology
            back = {
                "type": "analysis",
                "source_phrase": phrase,
                "translation": translation,
            }

            try:
                back.update(retrieve_morphology(phrase, language))
            except Exception as e:
                _logger.error(
                    "Skipping phrase at index %s due to morphology retrieval error: %s",
                    idx,
                    e,
                )
                continue

            # Fetch inflections for each token, where applicable
            for token in back["tokens"]:
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
            flashcard["back"] = back
            import_file_data["flashcards"].append(flashcard)

        if idx % 10 == 0:
            _logger.info("Progress: %s/%s", idx, sum(1 for _ in r))

        # Dump to output file
    t.write(f"{json.dumps(import_file_data, ensure_ascii=False)}\n")


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
    if len(sys.argv) != 2:
        raise ValueError(
            "Usage: main.py <language>; expects <language>.txt to be present"
        )
    lang = sys.argv[1]
    main(lang)
