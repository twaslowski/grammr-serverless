data "vercel_project" "project" {
  name = local.vercel_project_name
}

data "aws_caller_identity" "current" {}

data "aws_ecr_repository" "morphology_repository" {
  name = "grammr/morphology"
}