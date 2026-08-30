data "vercel_project" "project" {
  name = local.vercel_project_name
}

data "aws_ecr_repository" "morphology_repository" {
  name = "grammr/morphology"
}

data "aws_ecr_repository" "inflections_ru_repository" {
  name = "grammr/inflections-ru"
}

data "aws_ecr_repository" "inflections_latin_repository" {
  name = "grammr/inflections-latin"
}

data "aws_secretsmanager_secret_version" "bootstrap_secret" {
  secret_id = "/grammr/bootstrap"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# Holds the dictionary artifacts the dictionary Lambda reads. Created in the
# shared stack, which is why this is a lookup rather than a resource.
data "aws_s3_bucket" "artifacts" {
  bucket = "${data.aws_caller_identity.current.account_id}-${data.aws_region.current.region}-${local.application_name}"
}
