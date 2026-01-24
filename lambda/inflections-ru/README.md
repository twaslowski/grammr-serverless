# inflections-ru

This Lambda function provides inflections for the Russian language.
Build it like this:

## Build instructions

```shell
export AWS_ACCOUNT_ID=<AWS_ACCOUNT_ID>
export AWS_REGION=<AWS_REGION>

docker build -t grammr/inflections-ru:0.1.1

docker tag grammr/inflections-ru:0.1.1 $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-ru:0.1.1
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-ru:0.1.1
```

## Local Testing

You can test the Lambda image locally using Docker and the Lambda Runtime Interface Emulator (RIE),
which is included in the AWS Lambda base images.

1. Run the container:

   ```bash
   docker run -p 9000:8080 grammr/inflections-ru:0.1.1
   ```

2. Send a test request:

   ```bash
   curl -X POST "http://localhost:9000/2015-03-31/functions/function/invocations" \
     -H "Content-Type: application/json" \
     -d '{"body": "{\"lemma\": \"слово\", \"pos\": \"NOUN\"}"}'
   ```

**Note:** When testing locally with RIE, the request must wrap the body in a Lambda event structure with a `body` 
field containing JSON-encoded content. The response will also be in Lambda response format with `statusCode` and `body`.
You also need to explicitly specify the `application/json` Content-Type.
