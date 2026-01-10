variable "supabase_access_token" {
  description = "The access token for Supabase API."
  type        = string
  sensitive   = true
}

variable "supabase_organization_id" {
  description = "The organization ID for Supabase."
  type        = string
}

variable "vercel_api_key" {
  description = "The API key for Vercel."
  type        = string
  sensitive   = true
}
