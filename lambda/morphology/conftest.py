import os

import spacy
from spacy.cli import download

MODEL = os.getenv("SPACY_MODEL", "de_core_news_sm")

if not spacy.util.is_package(MODEL):
    download(MODEL)
