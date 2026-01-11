module "morphology_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "grammr-morphology-${var.environment}"
  description   = "Lambda function for morphology analysis in grammr"

  create_package = false
  package_type = "Image"
  architectures = ["arm64"]
  image_uri      = "${data.aws_ecr_repository.morphology_repository.repository_url}:${data.aws_ecr_repository.morphology_repository.most_recent_image_tags[0]}"

  memory_size = 1024
  timeout     = 30

  cloudwatch_logs_retention_in_days = 14
  attach_cloudwatch_logs_policy     = true

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers = {
    apigateway = {
      service    = "apigateway"
      source_arn = "arn:aws:execute-api:eu-central-1:${data.aws_caller_identity.current.account_id}:*"
    },
  }
}
