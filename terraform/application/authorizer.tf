module "authorizer_lambda" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "grammr-authorizer-${var.environment}"
  description   = "Lambda function for performing request authorization"
  handler       = "authorizer.lambda_handler"
  runtime       = "python3.14"
  memory_size   = 256
  timeout       = 30
  source_path   = "${path.module}/../../lambda/authorizer"

  cloudwatch_logs_retention_in_days = 14

  environment_variables = {
    VALID_API_KEY = random_password.api_key.result
  }

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers                        = local.lambda_allowed_triggers
}

# random api key
resource "random_password" "api_key" {
  length = 64

  special = false
  upper   = true
  lower   = true
}
