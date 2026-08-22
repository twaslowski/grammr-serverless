#!/bin/bash

VERSION=$(uvx poetry version -s)
export VERSION

IMAGE_TAG="grammr/inflections-ru:$VERSION"
ECR_TAG="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-ru:$VERSION"

aws ecr get-login-password --region "$AWS_REGION" | podman login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Building image for model: $model"
podman build -t "$IMAGE_TAG" .

echo "Tagging image for ECR"
podman tag "$IMAGE_TAG" "$ECR_TAG"

echo "Pushing to ECR: $ECR_TAG"
podman push "$ECR_TAG"
