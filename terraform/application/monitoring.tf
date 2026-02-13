resource "aws_cloudwatch_dashboard" "dashboard" {
  dashboard_name = "grammr-${var.environment}"
  dashboard_body = templatefile("dashboards/main.json.tpl", {
    env = var.environment
  })
}