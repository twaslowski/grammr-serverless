module "morphology_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  for_each = local.morphology.models

  function_name = "grammr-morphology-${each.key}-${var.environment}"
  description   = "Lambda function for morphology analysis in grammr"

  create_package = false
  package_type   = "Image"
  architectures  = ["arm64"]
  image_uri      = "${data.aws_ecr_repository.morphology_repository.repository_url}:${local.morphology.version}-${each.value}"

  memory_size = 1024
  timeout     = 30

  cloudwatch_logs_retention_in_days = 14
  attach_cloudwatch_logs_policy     = true

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers                        = local.lambda_allowed_triggers
}

module "inflection_ru_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "grammr-inflections-ru-${var.environment}"
  description   = "Lambda function to inflect russian words"

  create_package = false
  package_type   = "Image"
  architectures  = ["arm64"]
  image_uri      = "${data.aws_ecr_repository.inflections_ru_repository.repository_url}:${local.inflections_ru_version}"

  memory_size = 1024
  timeout     = 30

  cloudwatch_logs_retention_in_days = 14
  attach_cloudwatch_logs_policy     = true

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers                        = local.lambda_allowed_triggers
}

module "inflection_latin_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  for_each = local.inflections_latin.languages

  function_name = "grammr-inflections-latin-${each.value}-${var.environment}"
  description   = "Lambda function to inflect words for ${each.value}"

  create_package = false
  package_type   = "Image"
  architectures  = ["arm64"]
  image_uri      = "${data.aws_ecr_repository.inflections_latin_repository.repository_url}:${local.inflections_latin.version}-${each.value}"

  memory_size = 1024
  timeout     = 60

  cloudwatch_logs_retention_in_days = 14
  attach_cloudwatch_logs_policy     = true

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers                        = local.lambda_allowed_triggers
}

module "polly_lambda" {
  source = "terraform-aws-modules/lambda/aws"

  function_name = "grammr-tts-${var.environment}"
  description   = "Lambda function for AWS Polly TTS"
  handler       = "polly.lambda_handler"
  runtime       = "python3.14"
  memory_size   = 256
  timeout       = 30
  source_path   = "${path.module}/../../lambda/tts"

  trigger_on_package_timestamp = false

  cloudwatch_logs_retention_in_days = 14

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers                        = local.lambda_allowed_triggers

  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "polly:SynthesizeSpeech",
        ]
        Resource = "*"
      }
    ]
  })
}
