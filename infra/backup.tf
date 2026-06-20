# ─── AWS Backup (prod only) ───────────────────────────────────────────────────
# Daily snapshots of all DynamoDB tables, retained for 60 days.

locals {
  is_prod = var.environment == "prod"
}

resource "aws_backup_vault" "main" {
  count = local.is_prod ? 1 : 0
  name  = "${local.prefix}-vault"
}

resource "aws_backup_plan" "daily" {
  count = local.is_prod ? 1 : 0
  name  = "${local.prefix}-daily"

  rule {
    rule_name         = "daily-2am"
    target_vault_name = aws_backup_vault.main[0].name
    schedule          = "cron(0 2 * * ? *)"

    start_window      = 60
    completion_window = 180

    lifecycle {
      delete_after = 60
    }
  }
}

resource "aws_iam_role" "backup" {
  count = local.is_prod ? 1 : 0
  name  = "${local.prefix}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  count      = local.is_prod ? 1 : 0
  role       = aws_iam_role.backup[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

resource "aws_backup_selection" "dynamodb" {
  count        = local.is_prod ? 1 : 0
  name         = "${local.prefix}-dynamodb"
  plan_id      = aws_backup_plan.daily[0].id
  iam_role_arn = aws_iam_role.backup[0].arn

  resources = [
    aws_dynamodb_table.admins.arn,
    aws_dynamodb_table.products.arn,
    aws_dynamodb_table.orders.arn,
    aws_dynamodb_table.categories.arn,
    aws_dynamodb_table.counters.arn,
    aws_dynamodb_table.page_views.arn,
    aws_dynamodb_table.users.arn,
  ]
}
