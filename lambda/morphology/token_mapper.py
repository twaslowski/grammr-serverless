from spacy.tokens import Token

import feature_extraction
from domain import TokenMorphology


def from_spacy_token(token: Token) -> TokenMorphology:
    return TokenMorphology(
        text=token.text,
        lemma=token.lemma_,
        pos=token.pos_,
        features=feature_extraction.extract_features(token),
    )
