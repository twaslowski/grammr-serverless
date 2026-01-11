locals {
  vercel_project_name = "grammr-serverless"
  vercel_environment  = var.vercel_source_branch == "main" ? "production" : "preview"
  vercel_environment_variables = {
    NEXT_PUBLIC_APPLICATION_URL          = "https://${var.app_domain}"
    NEXT_PUBLIC_SUPABASE_URL             = var.supabase_project_url
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = var.supabase_publishable_key
  }
}