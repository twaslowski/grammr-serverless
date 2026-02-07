locals {
  application_name     = "grammr"
  vercel_project_name  = "grammr-serverless"
  vercel_environment   = var.environment == "prod" ? "production" : "preview"
  supabase_project_url = "https://${var.supabase_project_id}.supabase.co"

  vercel_environment_variables = {
    NEXT_PUBLIC_APPLICATION_URL          = "https://${var.app_domain}"
    NEXT_PUBLIC_SUPABASE_URL             = local.supabase_project_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = var.supabase_publishable_key
    API_GW_URL                           = module.api_gateway.stage_invoke_url
    API_GW_API_KEY                       = random_password.api_key.result
    DATABASE_URL                         = "postgresql://postgres.${var.supabase_project_id}:${var.supabase_db_password}@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
  }

  morphology = {
    models = {
      ru = "ru_core_news_md"
      it = "it_core_news_md"
      es = "es_core_news_md"
      pt = "pt_core_news_md"
      fr = "fr_core_news_md"
    }
    version = var.morphology_lambda_version
  }

  inflections_ru_version = "0.1.7"

  inflections_latin = {
    languages = toset(["es", "it", "pt"])
    version   = "0.3.0"
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