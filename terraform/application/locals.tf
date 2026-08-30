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

  inflections_ru_version = var.inflections_ru_lambda_version

  inflections_latin = {
    languages = toset(["es", "it", "pt", "fr"])
    version   = var.inflections_latin_lambda_version
  }

  dictionary = {
    # Languages with a published artifact in s3://<bucket>/dictionary/. One
    # deployment serves all of them -- unlike inflections, which needs a function
    # per language because each bakes in its own morphology library.
    languages = toset(["ru"])

    # The artifact is fetched into /tmp on cold start, so ephemeral storage has to
    # hold the largest published file with room to spare. Raise this before adding
    # a language whose file is bigger than the current headroom; the Lambda reports
    # a 503 rather than failing silently if the fetch cannot complete.
    ephemeral_storage_mb = 1024
  }

  # Files to keep out of the zip-packaged lambda artifacts.
  #
  # These are Python regexes matched against paths relative to the source
  # directory, and are applied to both the source tree and the dependencies uv
  # installs. A leading "!" excludes. Note that the packager walks the source
  # with followlinks=True, so a local .venv does not merely duplicate every
  # dependency, it also materialises the symlinked interpreter as three real
  # ~18 MB copies -- which on its own pushed the translate artifact past the
  # 50 MB direct-upload limit.
  lambda_source_excludes = [
    "!\\.venv(/.*)?",
    "!(.*/)?__pycache__(/.*)?",
    "!\\.pytest_cache(/.*)?",
    "!\\.ruff_cache(/.*)?",
    "!\\.mypy_cache(/.*)?",
    "!(.*/)?\\.DS_Store",
    "!\\.python-version",
    "!tests(/.*)?",
    "!test_.*\\.py",
    "!pytest\\.ini",
    "!conftest\\.py",
    "!local_server\\.py",
    "!event\\.json",
    "!INSTRUCTIONS_LOCAL\\.md",
  ]

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