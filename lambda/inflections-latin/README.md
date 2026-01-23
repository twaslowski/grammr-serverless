# inflections-latin

This service handles inflections for languages of the neo-Latin language family, i.e. Spanish, Italian, French,
Portuguese and Romanian. It is based on the `verbecc` library, so any features and limitations are tied to it.

Most notably, only conjugations are supported.

## Deployment

This component is not deployed to Lambda, because models cannot be downloaded at runtime.
It is built as a webserver instead. This webserver is likely (?) to be deployed onto ECS/Fargate,
with a Lambda scaling down to zero to minimize costs. Start-up times and memory consumption have to be
measured to weigh UX against cost-effectiveness.

## Build instructions

```shell
export AWS_ACCOUNT_ID=<AWS_ACCOUNT_ID>
export AWS_REGION=<AWS_REGION>

docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:0.1.0
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/grammr/inflections-latin:0.1.0
```

## Testing

```shell
docker run -p 5002:5000 grammr/inflections-latin:0.2.0

curl -X POST http://localhost:5002/inflect -d '{"lemma": "essere", "pos": "VERB", "language": "it"}'
```