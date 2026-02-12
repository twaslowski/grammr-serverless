# morphology

This Lambda function provides morphological analysis.
Because the entrypoint of an AWS Lambda Docker image has to be `lambda_handler.handler_func`,
the download of the image has to be performed at build time, resulting in larger image size
but reduced startup time. You can specify a model when building the Docker image by setting the
`SPACY_MODEL` build argument. For example, to use the `en_core_web_sm` model, you can run:

```bash
docker build --build-arg SPACY_MODEL=de_core_news_sm -t morphology:de_core_news_sm .
```

## Dependencies

This Lambda primarily relies on spaCy for morphological analysis and Pydantic for data validation.
Dependencies are managed with [uv](https://docs.astral.sh/uv/) via `pyproject.toml` and `uv.lock`.

The Dockerfile uses uv to export dependencies and install them during the build process.

## Local Testing

### pytest

Run tests with `uv run pytest`.
Note that you have to first download a model for testing purposes by running `uv run spacy download de_core_news_sm`.

### Docker image

You can test the Lambda image locally using Docker and the Lambda Runtime Interface Emulator (RIE), which is included in the AWS Lambda base images.

1. Build the image:

   ```bash
   docker build --build-arg SPACY_MODEL=en_core_web_sm -t morphology-lambda:en_core_web_sm .
   ```

2. Run the container:

   ```bash
   docker run -p 9000:8080 morphology-lambda:en_core_web_sm
   ```

3. Send a test request:

   ```bash
   curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
     -H "Content-Type: application/json" \
     -d '{"body": "{\"text\": \"Hello world\"}"}'
   ```

4. Expected response format:
   ```json
   {
     "statusCode": 200,
     "body": "{\"text\": \"Hello world\", \"tokens\": [...]}"
   }
   ```

**Note:** When testing locally with RIE, the request must wrap the body in a Lambda event structure with a `body` field containing JSON-encoded content. The response will also be in Lambda response format with `statusCode` and `body`.

## Deployment

The Lambda is deployed behind an API Gateway. The deployment process involves building the Docker image
and pushing it to AWS ECR, followed by updating the Lambda function to use the new image.

Build instructions:

```bash
docker build --build-arg SPACY_MODEL=ru_core_news_md -t grammr/morphology:0.1.0-ru_core_news_md .
docker tag grammr/morphology:0.1.0-ru_core_news_md $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/morphology:0.1.0-ru_core_news_md

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/morphology:0.1.0-ru_core_news_md
```

It is IMPORTANT to include the `Content-Type: application/json` header in your requests to the API Gateway,
as the Lambda function expects JSON input. Otherwise, the API Gateway will base64-encode the post body,
which the Lambda does not expect.
