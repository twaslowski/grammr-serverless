#!/bin/bash
#
# Builds a dictionary artifact and publishes it to S3.
#
#   ./publish.sh ru                                   # from the kaikki.org dump
#   ./publish.sh ru ~/dumps/raw-wiktextract-data.jsonl.gz
#
# The counterpart to `build.sh` in the container-image services: the Lambda is
# deployed by `task apply:<env>`, and this puts the data it reads in place. The
# two are deliberately separate -- the artifact changes on a Wiktionary refresh,
# the function changes when its code does, and coupling them would mean every
# `tofu apply` re-uploading hundreds of megabytes.
#
# Requires AWS_ACCOUNT_ID and AWS_REGION (both exported by .envrc).
set -euo pipefail

LANGUAGE="${1:?usage: ./publish.sh <language> [dump path or URL]}"
SOURCE="${2:-}"

BUCKET="${AWS_ACCOUNT_ID:?AWS_ACCOUNT_ID is not set}-${AWS_REGION:?AWS_REGION is not set}-grammr"
KEY="dictionary/${LANGUAGE}.sqlite"
OUT="dist/${LANGUAGE}.sqlite"

echo "==> Building ${OUT}"
if [ -n "$SOURCE" ]; then
  uv run --frozen python build.py "$LANGUAGE" --source "$SOURCE" --out "$OUT"
else
  uv run --frozen python build.py "$LANGUAGE" --out "$OUT"
fi

SIZE_MB=$(( $(wc -c < "$OUT") / 1024 / 1024 ))
echo "==> Artifact is ${SIZE_MB} MB"
echo "    Check this against local.dictionary.ephemeral_storage_mb in"
echo "    terraform/application/locals.tf -- the Lambda downloads it into /tmp,"
echo "    so ephemeral storage has to hold it with room to spare."

cat <<'REMINDER'

==> Before publishing, run the confidence gate:

      API_GW_URL=... API_GW_API_KEY=... uv run python verify.py dist/LANGUAGE.sqlite

    Two sources now claim to know this language's morphology. Where they
    disagree, one is wrong, and each class of disagreement is either a tag
    mapping bug or a real divergence worth knowing about.

REMINDER

read -r -p "Publish to s3://${BUCKET}/${KEY}? [y/N] " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Not published. The artifact is still at ${OUT}."
  exit 0
fi

echo "==> Uploading to s3://${BUCKET}/${KEY}"
aws s3 cp "$OUT" "s3://${BUCKET}/${KEY}"

echo "==> Done."
echo "    Warm containers keep the copy already in /tmp, so the new data reaches"
echo "    readers as those age out. Force it sooner by redeploying the function:"
echo "      task apply:dev"
