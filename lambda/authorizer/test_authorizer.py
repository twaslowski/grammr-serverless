"""
Tests for the Lambda authoriser.

All cryptography is real — genuine ES256 keys are generated and real JWTs are
signed and verified.  No mocking of the JWT library itself.

The only thing we stub out is the KeyProvider interface, replacing the remote
JWKS fetch with a thin wrapper that returns our locally-generated key.

Key ID (kid) handling
---------------------
Real Supabase tokens always carry a `kid` header.  PyJWKClient.get_signing_key_from_jwt
extracts that kid and looks for a PyJWK whose key_id matches.  Our StaticKeyProvider
bypasses the HTTP fetch but must still perform the same kid -> key resolution so that
the validate() code path behaves identically to production.
"""

import base64
import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from jwt import PyJWK, PyJWKClientError

from authorizer import lambda_handler, validate


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

TEST_KID = "test-key-1"


def _generate_ec_key_pair():
    """Return a (private_key, public_key) pair on the P-256 curve (ES256)."""
    private_key = ec.generate_private_key(ec.SECP256R1())
    return private_key, private_key.public_key()


def _make_token(
    private_key,
    *,
    kid: str = TEST_KID,
    audience: str = "authenticated",
    subject: str = "user-123",
    expiry_offset: int = 3600,
    algorithm: str = "ES256",
) -> str:
    """Sign and return a JWT. kid is always embedded in the JOSE header."""
    now = int(time.time())
    payload = {
        "sub": subject,
        "aud": audience,
        "iat": now,
        "exp": now + expiry_offset,
        "role": "authenticated",
    }
    return jwt.encode(
        payload,
        private_key,
        algorithm=algorithm,
        headers={"kid": kid},
    )


def _ec_public_key_to_jwk_dict(public_key, kid: str) -> dict:
    """Serialise an EC public key to a JWK dict, including the key ID."""
    nums = public_key.public_numbers()

    def to_base64url(n: int) -> str:
        return base64.urlsafe_b64encode(n.to_bytes(32, "big")).rstrip(b"=").decode()

    return {
        "kty": "EC",
        "crv": "P-256",
        "x": to_base64url(nums.x),
        "y": to_base64url(nums.y),
        "use": "sig",
        "alg": "ES256",
        "kid": kid,
    }


class StaticKeyProvider:
    """KeyProvider backed by a single in-memory key pair.

    Mirrors the interface of PyJWKClient: decodes the token header, extracts
    the kid, and returns the matching PyJWK -- or raises PyJWKClientError if
    no match is found.  This keeps test behaviour identical to production.
    """

    def __init__(self, public_key, kid: str = TEST_KID):
        jwk_dict = _ec_public_key_to_jwk_dict(public_key, kid)
        self._jwk = PyJWK(jwk_dict, algorithm="ES256")

    def get_signing_key_from_jwt(self, token: str) -> PyJWK:
        unverified = jwt.api_jwt.decode_complete(
            token, options={"verify_signature": False}
        )
        token_kid = unverified["header"].get("kid")
        if token_kid != self._jwk.key_id:
            raise PyJWKClientError(
                f'Unable to find a signing key that matches: "{token_kid}; has {self._jwk.key_id}"'
            )
        return self._jwk


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def key_pair():
    return _generate_ec_key_pair()


@pytest.fixture()
def private_key(key_pair):
    return key_pair[0]


@pytest.fixture()
def public_key(key_pair):
    return key_pair[1]


@pytest.fixture()
def key_provider(public_key):
    return StaticKeyProvider(public_key, kid=TEST_KID)


# ---------------------------------------------------------------------------
# validate() unit tests
# ---------------------------------------------------------------------------

class TestValidate:
    def test_valid_token_returns_true(self, private_key, key_provider):
        token = _make_token(private_key)
        assert validate(token, key_provider) is True

    def test_empty_token_returns_false(self, key_provider):
        assert validate("", key_provider) is False

    def test_expired_token_returns_false(self, private_key, key_provider):
        token = _make_token(private_key, expiry_offset=-1)
        assert validate(token, key_provider) is False

    def test_wrong_audience_returns_false(self, private_key, key_provider):
        token = _make_token(private_key, audience="wrong-audience")
        assert validate(token, key_provider) is False

    def test_tampered_signature_returns_false(self, private_key, key_provider):
        token = _make_token(private_key)
        header, payload, signature = token.rsplit(".", 2)
        bad_char = "A" if signature[-1] != "A" else "B"
        tampered = f"{header}.{payload}.{signature[:-1]}{bad_char}"
        assert validate(tampered, key_provider) is False

    def test_token_signed_with_different_key_returns_false(self, key_provider):
        other_private, _ = _generate_ec_key_pair()
        token = _make_token(other_private)
        assert validate(token, key_provider) is False

    def test_unknown_kid_returns_false(self, private_key, key_provider):
        token = _make_token(private_key, kid="unknown-key-id")
        assert validate(token, key_provider) is False

    def test_garbage_string_returns_false(self, key_provider):
        assert validate("not.a.jwt", key_provider) is False

    def test_malformed_bearer_token_returns_false(self, key_provider):
        assert validate("Bearer", key_provider) is False


# ---------------------------------------------------------------------------
# lambda_handler() integration tests
# ---------------------------------------------------------------------------

class TestLambdaHandler:
    def _event(self, token: str) -> dict:
        return {"headers": {"authorization": f"Bearer {token}"}}

    def test_authorized_with_valid_token(self, private_key, key_provider):
        token = _make_token(private_key)
        result = lambda_handler(self._event(token), None, key_provider=key_provider)
        assert result == {"isAuthorized": True}

    def test_unauthorized_with_expired_token(self, private_key, key_provider):
        token = _make_token(private_key, expiry_offset=-1)
        result = lambda_handler(self._event(token), None, key_provider=key_provider)
        assert result == {"isAuthorized": False}

    def test_unauthorized_with_no_authorization_header(self, key_provider):
        result = lambda_handler({"headers": {}}, None, key_provider=key_provider)
        assert result == {"isAuthorized": False}

    def test_unauthorized_with_missing_headers_key(self, key_provider):
        result = lambda_handler({}, None, key_provider=key_provider)
        assert result == {"isAuthorized": False}

    def test_authorization_header_without_bearer_prefix(self, private_key, key_provider):
        token = _make_token(private_key)
        event = {"headers": {"authorization": token}}
        result = lambda_handler(event, None, key_provider=key_provider)
        assert result == {"isAuthorized": False}

    def test_bearer_prefix_case_insensitive(self, private_key, key_provider):
        token = _make_token(private_key)
        event = {"headers": {"authorization": f"bearer {token}"}}
        result = lambda_handler(event, None, key_provider=key_provider)
        assert result == {"isAuthorized": True}

    def test_extra_whitespace_in_header_is_tolerated(self, private_key, key_provider):
        token = _make_token(private_key)
        event = {"headers": {"authorization": f"Bearer  {token}"}}
        result = lambda_handler(event, None, key_provider=key_provider)
        assert result == {"isAuthorized": True}

    def test_unauthorized_with_tampered_token(self, private_key, key_provider):
        token = _make_token(private_key)
        header, payload, sig = token.rsplit(".", 2)
        bad_char = "A" if sig[-1] != "A" else "B"
        tampered = f"{header}.{payload}.{sig[:-1]}{bad_char}"
        result = lambda_handler(self._event(tampered), None, key_provider=key_provider)
        assert result == {"isAuthorized": False}

    def test_unauthorized_with_unknown_kid(self, private_key, key_provider):
        token = _make_token(private_key, kid="some-other-key")
        result = lambda_handler(self._event(token), None, key_provider=key_provider)
        assert result == {"isAuthorized": False}