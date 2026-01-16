"""
Image Refresher Lambda

This Lambda function is a workaround for an issue where container-based Lambda functions
become inactive and fail to pull their images again due to ECR authentication issues.

It runs on a schedule (every 12 hours) and calls update-function-code on all container-based
Lambda functions with their current image URI, effectively refreshing the image association
without changing any configuration.
"""

import json
import logging

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def get_container_based_lambdas(lambda_client) -> list[dict]:
    """
    Retrieve all Lambda functions that use container images.

    Returns a list of dicts containing function name and image URI.
    """
    container_lambdas = []
    paginator = lambda_client.get_paginator("list_functions")

    for page in paginator.paginate():
        for function in page["Functions"]:
            # Container-based Lambdas have PackageType == "Image"
            if function.get("PackageType") == "Image":
                function_name = function["FunctionName"]
                # Get the full function configuration to retrieve the image URI
                try:
                    config = lambda_client.get_function(FunctionName=function_name)
                    image_uri = config["Code"].get("ImageUri")
                    if image_uri:
                        container_lambdas.append({
                            "function_name": function_name,
                            "image_uri": image_uri
                        })
                except ClientError as e:
                    logger.error(f"Error getting function {function_name}: {e}")

    return container_lambdas


def refresh_lambda_image(lambda_client, function_name: str, image_uri: str) -> bool:
    """
    Call update-function-code with the same image URI to refresh the image association.

    Returns True if successful, False otherwise.
    """
    try:
        lambda_client.update_function_code(
            FunctionName=function_name,
            ImageUri=image_uri
        )
        return True
    except ClientError as e:
        logger.error(f"Failed to refresh image for Lambda {function_name}: {e}")
        return False


def lambda_handler(_, __):
    """
    Main handler that queries all container-based Lambdas and refreshes their images.
    """
    try:
        lambda_client = boto3.client("lambda")

        # Get all container-based Lambdas
        container_lambdas = get_container_based_lambdas(lambda_client)

        # Refresh each Lambda's image
        results = {
            "successful": [],
            "failed": []
        }

        for lambda_info in container_lambdas:
            function_name = lambda_info["function_name"]
            image_uri = lambda_info["image_uri"]

            if refresh_lambda_image(lambda_client, function_name, image_uri):
                results["successful"].append(function_name)
            else:
                results["failed"].append(function_name)

        summary = {
            "total_found": len(container_lambdas),
            "successful_refreshes": len(results["successful"]),
            "failed_refreshes": len(results["failed"]),
            "successful_functions": results["successful"],
            "failed_functions": results["failed"]
        }

        logger.info(json.dumps(summary))

        return {
            "statusCode": 200,
            "body": json.dumps(summary)
        }
    except Exception as e:
        logger.info(json.dumps({
            "success": False,
            "reason": str(e)
        }))

