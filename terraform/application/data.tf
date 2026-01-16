data "vercel_project" "project" {
  name = local.vercel_project_name
}

data "aws_ecr_repository" "morphology_repository" {
  name = "grammr/morphology"
}

data "aws_ecr_repository" "inflections_ru_repository" {
  name = "grammr/inflections-ru"
}