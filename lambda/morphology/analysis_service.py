import os

import spacy

import token_mapper
from domain import AnalysisRequest, MorphologicalAnalysis

model = spacy.load(os.getenv("SPACY_MODEL"))


def perform_analysis(request: AnalysisRequest) -> MorphologicalAnalysis:
    spacy_tokens = model(request.text)
    return MorphologicalAnalysis(
        text=request.text,
        tokens=[token_mapper.from_spacy_token(token) for token in spacy_tokens],
    )
