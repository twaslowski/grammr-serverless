module "s3_bucket" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 5.0"
  bucket  = "246770851643-eu-central-1-grammr"

  attach_deny_insecure_transport_policy = true
  block_public_acls                     = true
  block_public_policy                   = true
  ignore_public_acls                    = true
  restrict_public_buckets               = true

  versioning = {
    enabled = true
  }

  attach_policy = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaPullModels"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::246770851643-eu-central-1-grammr/model/*",
          "arn:aws:s3:::246770851643-eu-central-1-grammr"
        ]
        Condition = {
          StringEquals = {
            "aws:PrincipalAccount" = "246770851643"
          }
        }
      }
    ]
  })
}
