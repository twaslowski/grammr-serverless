"""
Part of speech enum following Universal Dependencies conventions.

See: https://universaldependencies.org/u/pos/index.html
"""

from enum import Enum


class PartOfSpeech(Enum):
    """
    Supported parts of speech for inflection.

    These correspond to Universal Dependencies POS tags for word classes
    that can be inflected in Russian.
    """

    NOUN = "NOUN"  # Nouns
    ADJ = "ADJ"  # Adjectives
    VERB = "VERB"  # Verbs
    AUX = "AUX"  # Auxiliary verbs
