# VERCEL VARS
variable "vercel_api_key" {
  description = "The API key for Vercel."
  type        = string
  sensitive   = true
}

variable "vercel_project_id" {
  type        = string
  description = "The Vercel project ID. Can be derived from the project generated at terraform/shared/"
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

