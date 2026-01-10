terraform {
  backend "s3" {}
  required_providers {
    supabase = {
      source  = "supabase/supabase"
      version = "1.5.1"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "3.5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "3.7.2"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}

provider "vercel" {
  api_token = var.vercel_api_key
}