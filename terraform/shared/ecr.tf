locals {
  repositories = toset(["grammr/morphology", "grammr/inflections-ru"])
}

module "ecr" {
  source  = "terraform-aws-modules/ecr/aws"
  version = "~> 3.0"

  for_each = local.repositories

  repository_name = each.value

  create_repository_policy = true
  repository_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "LambdaPullImage",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        },
        Action = [
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchCheckLayerAvailability"
        ],
        Condition = {
          StringLike = {
            "aws:sourceArn" = "arn:aws:lambda:eu-central-1:246770851643:function:*"
          }
        }
      }
    ]
  })

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