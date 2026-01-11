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

variable "supabase_project_url" {
  type        = string
  description = "The Supabase project URL."
}

variable "supabase_publishable_key" {
  description = "The Supabase publishable key."
  type        = string
}