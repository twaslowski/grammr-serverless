"""
Per-language translation of Wiktionary form tags into grammr features.

wiktextract annotates every form it pulls out of an inflection table with a list
of free-text tags (``["genitive", "singular"]``). grammr's domain model instead
uses typed features (``{"type": "CASE", "value": "GEN"}``), which is what
`src/types/feature.ts` parses and what `InflectionsTable` matches cells on. This
package holds the mapping between the two, one module per language, because the
tag vocabulary Wiktionary uses is language-specific.
"""

from .base import (
    EXCLUDED_FROM_CELLS,
    Feature,
    MappedForm,
    map_pos,
)
from .ru import RussianTagMapper

MAPPERS = {
    "ru": RussianTagMapper,
}

__all__ = [
    "EXCLUDED_FROM_CELLS",
    "Feature",
    "MappedForm",
    "MAPPERS",
    "RussianTagMapper",
    "map_pos",
]
