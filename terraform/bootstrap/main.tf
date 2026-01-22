module "adyen_highway_secret" {
  source  = "terraform-aws-modules/secrets-manager/aws"
  version = "~> 2.0"

  name                    = "/grammr/bootstrap"
  description             = "grammr secrets"
  recovery_window_in_days = 30

  secret_string = jsonencode({
    openai_api_key = "",
    google_sso_client_id = "",
    google_sso_client_secret = ""
  })

  ignore_secret_changes = true
}
