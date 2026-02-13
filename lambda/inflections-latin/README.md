# inflections-latin

This service handles inflections for languages of the neo-Latin language family, i.e. Spanish, Italian, French,
Portuguese and Romanian. It is based on the `verbecc` library, so any features and limitations are tied to it.

Most notably, only conjugations are supported.

## Build instructions

```shell
export AWS_ACCOUNT_ID=<AWS_ACCOUNT_ID>
export AWS_REGION=<AWS_REGION>

docker build --build-arg LANGUAGE_CODE=es -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:0.1.0-es .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:0.1.0-es
```

## Local Testing

You can test the Lambda image locally using Docker and the Lambda Runtime Interface Emulator (RIE),
which is included in the AWS Lambda base images.

1. Run the container:

   ```bash
   docker run -p 9000:8080 grammr/inflections-latin:0.2.0-es
   ```

2. Send a test request:

   ```bash
   curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
     -H "Content-Type: application/json" \
     -d '{"body": "{\"lemma\": \"essere\", \"pos\": \"VERB\", \"language\": \"it\"}", "path": "/dev/inflections/it"}'
   ```

**Note:** When testing locally with RIE, the request must wrap the body in a Lambda event structure with a `body`
field containing JSON-encoded content. The response will also be in Lambda response format with `statusCode` and `body`.
You also need to explicitly specify the `application/json` Content-Type.

**Note**: This Lambda extracts the language code from `event.path`. This is done to stay consistent with the
`inflection-ru` Lambda, where just a Lemma and POS is required. Therefore, `path` has to be included in test payloads,
whereas in prod, the API Gateway forwards it.

## Building all

Use this script until proper CI is built.

```shell
export LANGUAGE_CODE=it
export VERSION=0.3.0

docker build --build-arg LANGUAGE_CODE=$LANGUAGE_CODE -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:$VERSION-$LANGUAGE_CODE .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:$VERSION-$LANGUAGE_CODE
```