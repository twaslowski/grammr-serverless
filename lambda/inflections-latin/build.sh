#!/bin/bash

VERSION=$(uvx poetry version -s)
export VERSION

# Read models.txt line by line
while IFS= read -r language || [ -n "$language" ]; do
    # Skip empty lines
    [ -z "$language" ] && continue

    # Build image with $language name appended to tag
    IMAGE_TAG="grammr/inflections-latin:$VERSION-$language"
    ECR_TAG="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:$VERSION-$language"

    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

    echo "Building image for language: $language"
    docker build -t "$IMAGE_TAG" --build-arg LANGUAGE_CODE="$language" .

    echo "Tagging image for ECR"
    docker tag "$IMAGE_TAG" "$ECR_TAG"

    echo "Pushing to ECR: $ECR_TAG"
    docker push "$ECR_TAG"

    echo "Completed: $language"
    echo "---"
done < languages.txt

echo "All models built and pushed successfully!"