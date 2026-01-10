resource "tls_private_key" "acme_account_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "acme_registration" "account" {
  account_key_pem = tls_private_key.acme_account_key.private_key_pem
  email_address   = "contact@twaslowski.com"
}

resource "acme_certificate" "app_domain_certificate" {
  account_key_pem = acme_registration.account.account_key_pem
  common_name     = cloudflare_dns_record.app_domain.name

  dns_challenge {
    provider = "cloudflare"
    config = {
      CF_DNS_API_TOKEN = var.cloudflare_api_key
      CF_API_EMAIL     = "contact@twaslowski.com"
    }
  }
}
