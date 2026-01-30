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