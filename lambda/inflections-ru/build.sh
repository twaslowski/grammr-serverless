#!/bin/bash

# This is super hacky, but there does not seem to be a clear way to get the version from pyproject.toml without installing poetry as of 02/2026
VERSION=$(grep "version" pyproject.toml | cut -d"=" -f2 | sed 's/\"//g' | sed 's/^ *//g')

export VERSION
docker build -t "grammr/inflections-ru:$VERSION" .

docker tag "grammr/inflections-ru:$VERSION" "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-ru:$VERSION"
docker push "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-ru:$VERSION"