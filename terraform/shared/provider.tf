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
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "supabase" {
  access_token = var.supabase_access_token
}

provider "vercel" {
  api_token = var.vercel_api_key
}

provider "aws" {
  default_tags {
    tags = local.default_tags
  }
}