# Annoyingly, git_branch can only be specified for non-production domains.
# Therefore, this code creates two separate resources for production and development domains.
resource "vercel_project_domain" "domain_prod" {
  count = var.environment == "prod" ? 1 : 0

  project_id = data.vercel_project.project.id
  domain     = var.app_domain
}

resource "vercel_project_domain" "domain_dev" {
  count = var.environment == "dev" ? 1 : 0

  project_id = data.vercel_project.project.id
  domain     = var.app_domain

  git_branch = "develop"
}

resource "vercel_project_environment_variable" "vercel_env" {
  for_each = local.vercel_environment_variables

  project_id = data.vercel_project.project.id
  key        = each.key
  value      = each.value
  target     = [local.vercel_environment]
}