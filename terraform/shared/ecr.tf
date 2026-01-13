locals {
  repositories = toset(["grammr/morphology", "grammr/inflections-ru"])
}

module "ecr" {
  source = "terraform-aws-modules/ecr/aws"
  version = "~> 3.0"

  for_each = local.repositories

  repository_name = each.value

  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 30 images",
        selection = {
          tagStatus     = "tagged",
          tagPrefixList = ["v"],
          countType     = "imageCountMoreThan",
          countNumber   = 30
        },
        action = {
          type = "expire"
        }
      }
    ]
  })
}