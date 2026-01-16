locals {
  application_name    = "grammr"
  vercel_project_name = "grammr-serverless"
  vercel_environment  = var.environment == "prod" ? "production" : "preview"

  vercel_environment_variables = {
    NEXT_PUBLIC_APPLICATION_URL          = "https://${var.app_domain}"
    NEXT_PUBLIC_SUPABASE_URL             = var.supabase_project_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = var.supabase_publishable_key
    API_GW_URL                           = module.api_gateway.stage_invoke_url
    OPENAI_API_KEY                       = var.openai_api_key
  }

  lambda_allowed_triggers = {
    apigateway = {
      service    = "apigateway"
      source_arn = "${module.api_gateway.api_execution_arn}/*"
    },
  }

  default_tags = {
    project     = local.application_name
    environment = var.environment
    managed-by  = "terraform"
  }
}