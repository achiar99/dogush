# ─── Build the backend before packaging ───────────────────────────────────────
resource "null_resource" "lambda_build" {
  triggers = {
    src_hash = sha256(join("", [
      for f in sort(fileset("${path.module}/../backend/src", "**/*.ts")) :
      filesha256("${path.module}/../backend/src/${f}")
    ]))
  }

  provisioner "local-exec" {
    command     = "bash build-lambda.sh"
    working_dir = "${path.module}/../scripts"
  }
}

# ─── Zip the built Lambda package ─────────────────────────────────────────────
data "archive_file" "lambda_zip" {
  depends_on  = [null_resource.lambda_build]
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambda-package"
  output_path = "${path.module}/lambda.zip"
}

# ─── Lambda function ───────────────────────────────────────────────────────────
resource "aws_lambda_function" "backend" {
  function_name    = "${local.prefix}-backend"
  role             = aws_iam_role.lambda.arn
  handler          = "backend/dist/lambda.handler"
  runtime          = "nodejs22.x"
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      NODE_ENV                            = var.environment
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
      JWT_SECRET                          = var.jwt_secret
      PRODUCTS_TABLE                      = aws_dynamodb_table.products.name
      ORDERS_TABLE                        = aws_dynamodb_table.orders.name
      ADMINS_TABLE                        = aws_dynamodb_table.admins.name
      USERS_TABLE                         = aws_dynamodb_table.users.name
      CATEGORIES_TABLE                    = aws_dynamodb_table.categories.name
      COUNTERS_TABLE                      = aws_dynamodb_table.counters.name
      PAGE_VIEWS_TABLE                    = aws_dynamodb_table.page_views.name
      RATE_LIMIT_TABLE                    = aws_dynamodb_table.rate_limit.name
      IMAGES_BUCKET                       = aws_s3_bucket.images.bucket
      IMAGES_BASE_URL                     = "https://${aws_s3_bucket.images.bucket_regional_domain_name}"
      NEW_ORDER_TOPIC_ARN                 = aws_sns_topic.new_order.arn
      TELEGRAM_BOT_TOKEN                  = var.telegram_bot_token
      TELEGRAM_CHAT_ID                    = var.telegram_chat_id
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_basic]
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.backend.function_name}"
  retention_in_days = 14
}
