import logging
import os
import sys
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError
from domain.language import LanguageCode

logger = logging.getLogger(__name__)

BUCKET_NAME = "246770851643-eu-central-1-grammr"
S3_MODEL_PREFIX = "models"
MODEL_DIR = sys.prefix + "/lib/python3.11/site-packages/verbecc/data/models"
MODEL_NAME_PATTERN = "trained_model-{}.zip"


class ModelException(BaseException):
    """Raised when the model cannot be found or downloaded."""
    pass


def is_model_present(lang: LanguageCode) -> bool:
    """
    Check if the model exists where the verbecc library expects it.
    verbecc does not expose this functionality perfectly, so this is technically duplication.

    :param lang: Language Code for the model
    :return:
    """
    if not os.path.isdir(MODEL_DIR):
        return False
    return os.path.isfile(f"{MODEL_DIR}/{MODEL_NAME_PATTERN.format(lang)}")


def download_model_from_s3(lang: LanguageCode) -> Path:
    """
    Download model from S3 to local site-packages directory.

    Args:
        lang: Language code for the model to download

    Returns:
        Path to the downloaded model file

    Raises:
        ModelException: If download fails for any reason
    """
    s3_client = boto3.client("s3")
    zip_filename = MODEL_NAME_PATTERN.format(lang)
    s3_key = f"{S3_MODEL_PREFIX}/{zip_filename}"

    # Determine local destination path
    try:
        local_path = Path(f"{MODEL_DIR}/{MODEL_NAME_PATTERN.format(lang)}")
    except Exception as ex:
        logger.error(
            "Failed to create local directory structure: %s", ex, exc_info=True
        )
        raise ModelException(
            f"Failed to create local directory for model storage: {ex}"
        ) from ex

    # Download from S3
    try:
        logger.info(
            "Downloading model from S3 (bucket=%s, key=%s) to %s",
            BUCKET_NAME,
            s3_key,
            local_path,
        )

        s3_client.download_file(
            Bucket=BUCKET_NAME, Key=s3_key, Filename=str(local_path)
        )

        # Verify file exists and has content
        if not local_path.exists():
            raise ModelException(
                f"Download completed but file does not exist at {local_path}"
            )

        file_size = local_path.stat().st_size
        if file_size == 0:
            raise ModelException(f"Downloaded file is empty: {local_path}")

        logger.info(
            "Successfully downloaded model (size=%d bytes) from S3 to %s",
            file_size,
            local_path,
        )

        return local_path

    except ClientError as ex:
        error_code = ex.response.get("Error", {}).get("Code", "Unknown")
        error_msg = ex.response.get("Error", {}).get("Message", str(ex))

        if error_code == "NoSuchKey":
            logger.error("Model not found in S3: %s", s3_key, exc_info=True)
            raise ModelException(f"Model file not found in S3: {s3_key}") from ex
        elif error_code == "403" or error_code == "AccessDenied":
            logger.error("Access denied to S3 object: %s", s3_key, exc_info=True)
            raise ModelException(
                f"Access denied when downloading from S3: {error_msg}"
            ) from ex
        else:
            logger.error(
                "S3 client error downloading model (code=%s): %s",
                error_code,
                error_msg,
                exc_info=True,
            )
            raise ModelException(
                f"Failed to download model from S3 (error code: {error_code}): {error_msg}"
            ) from ex

    except BotoCoreError as ex:
        logger.error("BotoCore error downloading model: %s", ex, exc_info=True)
        raise ModelException(f"AWS SDK error while downloading model: {ex}") from ex

    except Exception as ex:
        logger.error(
            "Unexpected error downloading model from S3: %s", ex, exc_info=True
        )
        raise ModelException(f"Unexpected error downloading model from S3: {ex}") from ex
