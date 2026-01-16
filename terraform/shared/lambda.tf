# =============================================================================
# Image Refresher Lambda
# =============================================================================
#
# WORKAROUND: Container-based Lambda functions occasionally become inactive and
# fail to pull their images from ECR due to authentication issues. Despite
# attempts to fix IAM and ECR repository permissions, the issue persists.
#
# This Lambda runs every 12 hours and calls `update-function-code` on all
# container-based Lambdas with their current image URI. This effectively
# refreshes the image association without changing any configuration, ensuring
# the Lambdas remain operational.
#
# The Lambda:
# 1. Queries all Lambda functions in the account
# 2. Filters for those with PackageType == "Image"
# 3. Retrieves their current image URI
# 4. Calls update-function-code with the same image URI
# =============================================================================

module "image_refresher_lambda" {
  source  = "terraform-aws-modules/lambda/aws"
  version = "~> 8.0"

  function_name = "grammr-image-refresher"
  description   = "Refreshes container-based Lambdas by re-applying their image URIs to work around ECR auth issues"
  handler       = "refresher.lambda_handler"
  runtime       = "python3.12"
  source_path   = "${path.module}/image-refresher-lambda"

  memory_size = 256
  timeout     = 60

  cloudwatch_logs_retention_in_days = 14
  attach_cloudwatch_logs_policy     = true

  # IAM policy to allow listing and updating Lambda functions
  attach_policy_json = true
  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListLambdaFunctions"
        Effect = "Allow"
        Action = [
          "lambda:ListFunctions",
          "lambda:GetFunction"
        ]
        Resource = "*"
      },
      {
        Sid    = "UpdateLambdaCode"
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode"
        ]
        # Only allow updating Lambdas in this account
        Resource = "arn:aws:lambda:*:${data.aws_caller_identity.current.account_id}:function:*"
      }
    ]
  })

  # Schedule to run every 12 hours
  create_current_version_allowed_triggers = false
  allowed_triggers = {
    scheduled_refresh = {
      principal  = "events.amazonaws.com"
      source_arn = aws_cloudwatch_event_rule.image_refresher_schedule.arn
    }
  }
}

# CloudWatch Event Rule to trigger the Lambda every 12 hours
resource "aws_cloudwatch_event_rule" "image_refresher_schedule" {
  name                = "grammr-image-refresher-schedule"
  description         = "Triggers the image refresher Lambda every 12 hours"
  schedule_expression = "rate(12 hours)"

  tags = local.default_tags
}

# CloudWatch Event Target to invoke the Lambda
resource "aws_cloudwatch_event_target" "image_refresher_target" {
  rule      = aws_cloudwatch_event_rule.image_refresher_schedule.name
  target_id = "ImageRefresherLambda"
  arn       = module.image_refresher_lambda.lambda_function_arn
}