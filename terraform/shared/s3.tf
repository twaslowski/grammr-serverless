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
        Sid    = "AllowLambdaReadArtifacts"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          # spaCy and verbecc models. Staged here rather than baked into images.
          "arn:aws:s3:::246770851643-eu-central-1-grammr/model/*",
          # Dictionary artifacts, one SQLite file per language, built offline by
          # lambda/dictionary-build and fetched into /tmp on cold start.
          "arn:aws:s3:::246770851643-eu-central-1-grammr/dictionary/*",
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
