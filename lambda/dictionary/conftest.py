"""
Shared fixtures.

The artifact under test is built from the same committed dump slice the builder
uses (`lambda/dictionary-build/fixtures/ru-sample.jsonl`), by importing the
builder directly. Testing the Lambda against a hand-written SQLite file would let
the two halves drift: the thing worth asserting is that what the builder writes
is what the reader can serve.
"""

import importlib.util
import sys
from pathlib import Path

import pytest

BUILDER = Path(__file__).resolve().parent.parent / "dictionary-build"
FIXTURE = BUILDER / "fixtures" / "ru-sample.jsonl"


def _load_builder():
    sys.path.insert(0, str(BUILDER))
    spec = importlib.util.spec_from_file_location("dictionary_build", BUILDER / "build.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def artifact_dir(tmp_path_factory) -> Path:
    """A directory holding a freshly built ``ru.sqlite``, as the Lambda expects."""
    directory = tmp_path_factory.mktemp("artifacts")
    _load_builder().build(str(FIXTURE), "ru", directory / "ru.sqlite")
    return directory


@pytest.fixture(autouse=True)
def staged_artifact(artifact_dir, monkeypatch):
    """
    Point the store at the staged artifact instead of S3.

    Setting the cache directory rather than mocking boto3 exercises the same code
    path the Lambda takes on a warm container, and keeps the tests independent of
    boto3 being installed at all.
    """
    import store

    monkeypatch.setattr(store, "CACHE_DIR", str(artifact_dir))
    store.reset()
    yield
    store.reset()


def event(path: str = "/dictionary/ru", body: str | None = None) -> dict:
    return {"rawPath": path, "path": path, "body": body}
