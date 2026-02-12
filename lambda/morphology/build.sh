#!/bin/bash

VERSION=$(uvx poetry version -s)
export VERSION

# Read models.txt line by line
while IFS= read -r model || [ -n "$model" ]; do
    # Skip empty lines
    [ -z "$model" ] && continue

    # Build image with model name appended to tag
    IMAGE_TAG="grammr/morphology:$VERSION-$model"
    ECR_TAG="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/morphology:$VERSION-$model"

    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

    echo "Building image for model: $model"
    docker build -t "$IMAGE_TAG" --build-arg SPACY_MODEL="$model" .

    echo "Tagging image for ECR"
    docker tag "$IMAGE_TAG" "$ECR_TAG"

    echo "Pushing to ECR: $ECR_TAG"
    docker push "$ECR_TAG"

    echo "Completed: $model"
    echo "---"
done < models.txt

echo "All models built and pushed successfully!"