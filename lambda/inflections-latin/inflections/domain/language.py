from enum import StrEnum


class LanguageCode(StrEnum):
    """Supported Romance languages with their ISO 639-1 codes."""

    ITALIAN = "it"
    FRENCH = "fr"
    SPANISH = "es"
    PORTUGUESE = "pt"
    ROMANIAN = "ro"

    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive lookup."""
        if isinstance(value, str):
            value_lower = value.lower()
            for member in cls:
                if member.value.lower() == value_lower:
                    return member
        return None
