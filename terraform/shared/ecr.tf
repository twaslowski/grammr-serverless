locals {
  repositories = toset(["grammr/morphology", "grammr/inflections-ru"])
}

module "ecr" {
  source  = "terraform-aws-modules/ecr/aws"
  version = "~> 3.0"

  for_each = local.repositories

  repository_name = each.value

  create_repository_policy = true
  repository_policy_statements = {
    lambda_access = {
      sid     = "LambdaAccess"
      effect  = "Allow"
      actions = [
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ]
      principals = [
        {
          type        = "Service"
          identifiers = ["lambda.amazonaws.com"]
        }
      ]
      conditions = [
        {
          test     = "StringEquals"
          variable = "aws:SourceAccount"
          values   = [data.aws_caller_identity.current.account_id]
        }
      ]
    }
  }
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 30 tagged images",
        selection = {
          tagStatus     = "tagged",
          tagPrefixList = ["v"],
          countType     = "imageCountMoreThan",
          countNumber   = 30
        },
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2,
        description  = "Keep untagged images for 14 days",
        selection = {
          tagStatus   = "untagged",
          countType   = "sinceImagePushed",
          countUnit   = "days",
          countNumber = 14
        },
        action = {
          type = "expire"
        }
      }
    ]
  })
}