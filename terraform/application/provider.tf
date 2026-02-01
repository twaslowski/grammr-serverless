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
    acme = {
      source  = "vancluever/acme"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = "1.12.2"
}

provider "vercel" {
  api_token = var.vercel_api_key
}

provider "acme" {
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
  # For testing, use: "https://acme-staging-v02.api.letsencrypt.org/directory"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_key
}

provider "aws" {
  default_tags {
    tags = local.default_tags
  }
}
