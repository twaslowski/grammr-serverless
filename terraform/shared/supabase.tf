resource "supabase_project" "production" {
  organization_id   = var.supabase_organization_id
  name              = "grammr"
  database_password = random_password.password.result
  region            = "eu-west-1"

  lifecycle {
    ignore_changes = [database_password]
  }
}

resource "random_password" "password" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}