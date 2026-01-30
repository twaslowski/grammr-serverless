module "api_gateway" {
  source  = "terraform-aws-modules/apigateway-v2/aws"
  version = "~> 6.0"

  name          = "grammr-gateway-${var.environment}"
  description   = "grammr API Gateway"
  protocol_type = "HTTP"

  create_domain_name = false

  stage_name   = var.environment
  create_stage = true
  deploy_stage = true

  authorizers = {
    token = {
      name                              = "token"
      authorizer_type                   = "REQUEST"
      identity_sources                  = ["$request.header.x-api-key"]
      authorizer_uri                    = module.authorizer_lambda.lambda_function_invoke_arn
      enable_simple_responses           = true
      authorizer_payload_format_version = "2.0"
    }
  }

  cors_configuration = {
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods = ["GET"]
    allow_origins = ["*"]
  }

  # Access logs
  stage_access_log_settings = {
    create_log_group            = true
    log_group_retention_in_days = 7
    format = jsonencode({
      context = {
        domainName              = "$context.domainName"
        integrationErrorMessage = "$context.integrationErrorMessage"
        protocol                = "$context.protocol"
        requestId               = "$context.requestId"
        requestTime             = "$context.requestTime"
        responseLength          = "$context.responseLength"
        routeKey                = "$context.routeKey"
        stage                   = "$context.stage"
        status                  = "$context.status"
        error = {
          message      = "$context.error.message"
          responseType = "$context.error.responseType"
        }
        identity = {
          sourceIP = "$context.identity.sourceIp"
        }
        integration = {
          error             = "$context.integration.error"
          integrationStatus = "$context.integration.integrationStatus"
        }
      }
    })
  }

  # Routes & Integration(s)
  routes = merge(
    # Dynamically generate morphology routes for each language
    {
      for lang, _ in local.morphology.models :
      "POST /morphology/${lang}" => {
        integration = {
          uri    = module.morphology_lambda[lang].lambda_function_invoke_arn
          type   = "AWS_PROXY"
          method = "POST"
        }
      }
    },
    {
      for lang in local.inflections_latin.languages :
      "POST /inflections/${lang}" => {
        integration = {
          uri    = module.inflection_latin_lambda[lang].lambda_function_invoke_arn
          type   = "AWS_PROXY"
          method = "POST"
        }
      }
    },
    # Static routes
    {
      "POST /inflections/ru" = {
        integration = {
          uri         = module.inflection_ru_lambda.lambda_function_invoke_arn
          type        = "AWS_PROXY"
          description = "Inflections for Russian language"
          method      = "POST"
        }
      }
      "POST /tts" = {
        authorization_type = "CUSTOM"
        authorizer_key     = "token"

        integration = {
          uri    = module.polly_lambda.lambda_function_invoke_arn
          type   = "AWS_PROXY"
          method = "POST"
        }
      }
      "POST /translate" = {
        authorization_type = "CUSTOM"
        authorizer_key     = "token"

        integration = {
          uri    = module.translate_lambda.lambda_function_invoke_arn
          type   = "AWS_PROXY"
          method = "POST"
        }
      }
    }
  )
}