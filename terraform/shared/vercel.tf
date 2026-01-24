resource "vercel_project" "project" {
  name      = "grammr-serverless"
  framework = "nextjs"

  ignore_command = "bash should-deploy.sh"

  git_repository = {
    type = "github"
    repo = "twaslowski/grammr-serverless"
  }

  automatically_expose_system_environment_variables = true
}
