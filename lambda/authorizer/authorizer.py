import json
import os
import logging
from typing import Protocol

import jwt
from jwt import PyJWKClient, PyJWK

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Key provider abstraction
# ---------------------------------------------------------------------------

class KeyProvider(Protocol):
    """Retrieves a signing key for a given JWT."""

    def get_signing_key_from_jwt(self, token: str) -> PyJWK:
        ...


class JWKSKeyProvider:
    """Production key provider backed by a remote JWKS endpoint."""

    def __init__(self, jwks_url: str) -> None:
        self._client = PyJWKClient(jwks_url, cache_keys=True)

    def get_signing_key_from_jwt(self, token: str) -> PyJWK:
        return self._client.get_signing_key_from_jwt(token)


def _default_key_provider() -> KeyProvider:
    jwks_url = os.environ["SUPABASE_JWK_URL"]
    return JWKSKeyProvider(jwks_url)


# ---------------------------------------------------------------------------
# Core validation logic
# ---------------------------------------------------------------------------

def validate(token: str, key_provider: KeyProvider) -> bool:
    """Return True if the token is a valid, unexpired Supabase JWT."""
    if not token:
        return False
    try:
        signing_key = key_provider.get_signing_key_from_jwt(token)
        jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return True
    except Exception as exc:
        logger.info(token)
        logger.warning(json.dumps({
            "message": "Token validation failed",
            "error": str(exc),
        }))
        return False


# ---------------------------------------------------------------------------
# Lambda entry point
# ---------------------------------------------------------------------------

def lambda_handler(event: dict, context, key_provider: KeyProvider | None = None) -> dict:
    key_provider = _default_key_provider()

    auth_header = event.get("headers", {}).get("authorization", "")
    parts = auth_header.split()
    token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else ""

    result = validate(token, key_provider)
    return {"isAuthorized": result}


# ---------------------------------------------------------------------------
# Local smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    with open("test.txt") as f:
        contents = f.read().strip()
    event = {"headers": {"authorization": f"Bearer {contents}"}}
    print(lambda_handler(event, None))