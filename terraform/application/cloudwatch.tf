module "morphology_logging" {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/log-group"
  version = "~> 3.0"

  name              = "/aws/lambda/morphology/${var.environment}"
  retention_in_days = 14
}

module "inflection_logging" {
  source  = "terraform-aws-modules/cloudwatch/aws//modules/log-group"
  version = "~> 3.0"

  name              = "/aws/lambda/inflection/${var.environment}"
  retention_in_days = 14
}