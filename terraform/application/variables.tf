variable "environment" {
  description = "The environment to deploy to (dev | prod)"
  type        = string
}

variable "vercel_api_key" {
  description = "The API key for Vercel."
  type        = string
  sensitive   = true
}

variable "cloudflare_api_key" {
  description = "The API key for Cloudflare."
  type        = string
  sensitive   = true
}

variable "app_domain" {
  description = "The custom domain for the Vercel project."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare Zone ID for the domain."
  type        = string
}

variable "supabase_project_id" {
  type        = string
  description = "The Supabase project URL."
}

variable "supabase_db_password" {
  type      = string
  sensitive = true
}

variable "supabase_publishable_key" {
  description = "The Supabase publishable key."
  type        = string
}

variable "deepl_api_key" {
  description = "The API key for DeepL."
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "The API key for OpenAI."
  type        = string
  sensitive   = true
}

variable "morphology_lambda_version" {
  description = "Version of the morphology lambda"
  type        = string
}