# inflections-ru

This Lambda function provides inflections for the Russian language.
Build it like this:

```bash
docker build -t grammr/inflections-latin:0.1.0 .
```

## Local Testing

You can test the Lambda image locally using Docker and the Lambda Runtime Interface Emulator (RIE), which is included in the AWS Lambda base images.

1. Run the container:

   ```bash
   docker run -p 9000:8080 grammr/inflections-latin:0.1.0
   ```

2. Send a test request:

   ```bash
   curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
     -H "Content-Type: application/json" \
     -d '{"body": "{\"lemma\": \"слово\", \"pos\": \"NOUN\"}"}'
   ```

3. Expected response format:
   ```json
   {
     "statusCode": 200,
     "body": "{\"source_phrase\": \"Hello world\", \"tokens\": [...]}"
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
