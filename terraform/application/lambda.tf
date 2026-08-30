module "morphology_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  depends_on = [module.morphology_logging]

  for_each = local.morphology.models

  function_name = "grammr-morphology-${each.key}-${var.environment}"
  description   = "Lambda function for morphology analysis in grammr"

  create_package = false
  package_type   = "Image"
  architectures  = ["arm64"]
  image_uri      = "${data.aws_ecr_repository.morphology_repository.repository_url}:${local.morphology.version}-${each.value}"

  memory_size = 1024
  timeout     = 30

  use_existing_cloudwatch_log_group = true
  logging_log_group                 = module.morphology_logging.cloudwatch_log_group_name

  attach_policy_statements = true
  policy_statements = {
    cloudwatch = {
      effect = "Allow"
      actions = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ]
      resources = ["${module.morphology_logging.cloudwatch_log_group_arn}:*"]
    }
  }

  # https://github.com/terraform-aws-modules/terraform-aws-lambda/issues/36#issuecomment-650217274
  create_current_version_allowed_triggers = false
  allowed_triggers                        = local.lambda_allowed_triggers
}

module "inflection_ru_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  depends_on = [module.inflection_logging]

  function_name = "grammr-inflections-ru-${var.environment}"
  description   = "Lambda function to inflect russian words"

  create_package = false
  package_type   = "Image"
  architectures  = ["arm64"]
  image_uri      = "${data.aws_ecr_repository.inflections_ru_repository.repository_url}:${local.inflections_ru_version}"

  memory_size = 1024
  timeout     = 30

  use_existing_cloudwatch_log_group = true
  logging_log_group                 = module.inflection_logging.cloudwatch_log_group_name

  attach_policy_statements = true
  policy_statements = {
    cloudwatch = {
      effect = "Allow"
      actions = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ]
      resources = ["${module.inflection_logging.cloudwatch_log_group_arn}:*"]
    }
  }

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

  use_existing_cloudwatch_log_group = true
  logging_log_group                 = module.inflection_logging.cloudwatch_log_group_name

  attach_policy_statements = true
  policy_statements = {
    cloudwatch = {
      effect = "Allow"
      actions = [
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ]
      resources = ["${module.inflection_logging.cloudwatch_log_group_arn}:*"]
    }
  }

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
  source_path = [{
    path       = "${path.module}/../../lambda/tts"
    uv_install = true
    patterns   = local.lambda_source_excludes
  }]

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

module "translate_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "8.4.0"

  function_name = "grammr-translate-${var.environment}"
  description   = "Lambda function for performing translations with the AWS Translate service"
  handler       = "translate.lambda_handler"
  runtime       = "python3.14"
  memory_size   = 256
  timeout       = 30
  source_path = [{
    path       = "${path.module}/../../lambda/translate"
    uv_install = true
    patterns   = local.lambda_source_excludes
  }]

  cloudwatch_logs_retention_in_days = 14

  environment_variables = {
    DEEPL_API_KEY  = var.deepl_api_key
    OPENAI_API_KEY = var.openai_api_key
  }

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
          "translate:TranslateText",
        ]
        Resource = "*"
      }
    ]
  })
}


module "dictionary_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "grammr-dictionary-${var.environment}"
  description   = "Lambda function for dictionary lookups over the wiktextract artifacts"
  handler       = "lambda_handler.handler"
  runtime       = "python3.14"

  # Memory drives network and CPU allocation as well as heap, and the dominant
  # cost on a cold start here is pulling the SQLite artifact out of S3, so this is
  # sized for the download rather than for the queries that follow it.
  memory_size = 1024
  timeout     = 30

  # The artifact is cached in /tmp for the life of the container, which is what
  # turns the fetch into a per-cold-start rather than a per-request cost.
  ephemeral_storage_size = local.dictionary.ephemeral_storage_mb

  # No dependencies at all: the artifact is read with the standard library's
  # sqlite3, so this packages to a few kilobytes. boto3 comes from the runtime.
  source_path = [{
    path       = "${path.module}/../../lambda/dictionary"
    uv_install = true
    patterns   = local.lambda_source_excludes
  }]

  trigger_on_package_timestamp = false

  cloudwatch_logs_retention_in_days = 14

  environment_variables = {
    DICTIONARY_BUCKET = data.aws_s3_bucket.artifacts.id
    DICTIONARY_PREFIX = "dictionary"
  }

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
          "s3:GetObject",
        ]
        # Scoped to the dictionary prefix: this function has no business reading
        # the spaCy and verbecc models that share the bucket.
        Resource = "${data.aws_s3_bucket.artifacts.arn}/dictionary/*"
      }
    ]
  })
}
