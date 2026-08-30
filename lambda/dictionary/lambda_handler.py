"""
AWS Lambda handler for the dictionary service.

One entry point serves every language: `POST /dictionary/{language}` carries the
target language in the path, and the artifact for it is loaded on demand. That is
different from `/inflections/*`, where each language is its own function because
each needs its own morphology library baked into an image.

Unlike the inflections endpoint, a lookup that finds nothing is not an error. An
empty `entries` list means the word is unknown; an entry whose `inflections` is
`null` means the word is real and simply does not inflect. Both are 200s, because
both are answers a dictionary is supposed to be able to give.
"""

import logging

import lambda_util
import store
from data import SUPPORTED_LANGUAGES, LookupRequest, extract_language

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def handler(event, _):
    """
    Serve one lookup.

    Args:
        event: API Gateway proxy event.
        _: Lambda context (unused).

    Returns:
        HTTP response dict with status code, headers and body.
    """
    language = None
    try:
        try:
            language = extract_language(event)
        except ValueError as e:
            return lambda_util.fail(
                404,
                str(e),
                context={"error": str(e), "supported": SUPPORTED_LANGUAGES},
            )

        if lambda_util.is_keep_warm(event):
            # Prime the artifact rather than returning immediately. Fetching the
            # SQLite file is the whole cost of a cold start here, so a warm-up
            # that skipped it would report success while leaving the next real
            # request to pay for it.
            store.connect(language)
            return lambda_util.ok({"keep-warm": "success"}, {}, language)

        try:
            request = LookupRequest.from_event(event)
        except ValueError as e:
            return lambda_util.fail(
                400, str(e), context={"error": str(e)}, language=language
            )

        entries = store.lookup(language, request.norm, request.pos)
        meta = store.metadata(language)

        return lambda_util.ok(
            {
                "query": request.query,
                "entries": entries,
                "attribution": {
                    "source": meta.get("source"),
                    "license": meta.get("license"),
                    "licenseUrl": meta.get("license_url"),
                },
            },
            context={
                "query": request.query,
                "norm": request.norm,
                "pos": request.pos,
                "entries": len(entries),
            },
            language=language,
        )

    except store.ArtifactUnavailable as e:
        # The artifact is missing or unreadable, which is an operational problem
        # rather than a bad request. 503 rather than 500 so the caller can tell
        # "try again once this is deployed properly" from "this query broke us".
        return lambda_util.fail(
            503,
            "Dictionary data is unavailable",
            context={"error": str(e)},
            language=language,
        )

    except Exception as e:
        return lambda_util.fail(
            500,
            "Encountered unexpected error",
            context={"error": str(e), "raw_event": event},
            language=language,
        )
