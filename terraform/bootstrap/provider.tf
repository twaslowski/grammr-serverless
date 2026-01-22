terraform {
  backend "s3" {
    bucket = "246770851643-eu-central-1-terraform-state"
    key    = "grammr/application/bootstrap.tfstate"
    region = "eu-central-1"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  default_tags {
    tags = local.default_tags
  }
}