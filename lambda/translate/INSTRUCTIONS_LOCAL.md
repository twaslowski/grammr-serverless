# Instructions: Running translate.py Lambda Locally

You can invoke the translate.py Lambda locally by simulating an AWS Lambda event. Here are the steps:

## 1. Prepare a Test Payload

Create a file named `event.json` in the same directory with the following content (adjust values as needed):

```
{
  "body": "{\"text\": \"Hello, world!\", \"source_language\": \"en\", \"target_language\": \"de\"}"
}
```

## 2. Run translate.py Locally

```
python translate.py
```
