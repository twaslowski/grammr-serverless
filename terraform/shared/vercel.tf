resource "vercel_project" "project" {
  name      = "grammr-serverless"
  framework = "vite"

  git_repository = {
    type = "github"
    repo = "twaslowski/grammr-serverless"
  }

  automatically_expose_system_environment_variables = true
}
