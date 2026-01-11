# VERCEL VARS
variable "vercel_api_key" {
  description = "The API key for Vercel."
  type        = string
  sensitive   = true
}

variable "vercel_source_branch" {
  description = "The source branch for Vercel preview deployments."
  type        = string
}

variable "app_domain" {
  description = "The custom domain for the Vercel project."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare Zone ID for the domain."
  type        = string
}

# DNS & CERT VARS
variable "cloudflare_api_key" {
  description = "The API key for Cloudflare."
  type        = string
  sensitive   = true
}

variable "supabase_project_url" {
  type        = string
  description = "The Supabase project URL."
}

variable "supabase_publishable_key" {
  description = "The Supabase publishable key."
  type        = string
}