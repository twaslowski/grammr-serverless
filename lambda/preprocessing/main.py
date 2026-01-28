import json
import logging
import os
import sys

import requests
from supabase import create_client, Client

url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]
api_gw_base_url = os.environ["API_GW_URL"]

_supabase: Client = create_client(url, key)
_logger = logging.getLogger()
logging.basicConfig(level=logging.INFO)


def main(language: str):
    with open(f"{language}.txt", "r", encoding="utf-8") as f, open(
        f"{language}.jsonl", "w", encoding="utf-8"
    ) as t:
        lines = f.readlines()
        for line in lines[:1]:
            # Fetch morphology for phrase
            morphology = retrieve_morphology(line, language)

            # Fetch inflections for each token, where applicable
            for token in morphology["tokens"]:
                if token["pos"] in ["NOUN", "ADJ", "VERB", "AUX"]:
                    inflections = retrieve_inflections(
                        token["text"], token["pos"], language
                    )
                    # If call was successful, enrich Token
                    if inflections and not inflections.get("error"):
                        token["paradigm"] = inflections
                        _logger.debug("Got inflections: %s", inflections)

            t.write(f"{json.dumps(morphology)}\n")


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


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise ValueError(
            "Usage: main.py <language>; expects <language>.txt to be present"
        )
    lang = sys.argv[1]
    main(lang)
