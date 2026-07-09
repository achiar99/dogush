resource "aws_iam_role" "lambda" {
  name = "${local.prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${local.prefix}-lambda-dynamodb"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query",
      ]
      Resource = [
        aws_dynamodb_table.admins.arn,
        aws_dynamodb_table.products.arn,
        "${aws_dynamodb_table.products.arn}/index/*",
        aws_dynamodb_table.orders.arn,
        "${aws_dynamodb_table.orders.arn}/index/*",
        aws_dynamodb_table.users.arn,
        "${aws_dynamodb_table.users.arn}/index/*",
        aws_dynamodb_table.categories.arn,
        aws_dynamodb_table.counters.arn,
        aws_dynamodb_table.page_views.arn,
        "${aws_dynamodb_table.page_views.arn}/index/*",
        aws_dynamodb_table.rate_limit.arn,
      ]
    }]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "${local.prefix}-lambda-s3"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"]
      Resource = "${aws_s3_bucket.images.arn}/*"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_sns" {
  name = "${local.prefix}-lambda-sns"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["sns:Publish"]
      Resource = aws_sns_topic.new_order.arn
    }]
  })
}

# Cost Explorer for the admin dashboard's month-to-date AWS spend.
# ce:* actions do not support resource-level scoping, so Resource must be "*".
resource "aws_iam_role_policy" "lambda_cost_explorer" {
  name = "${local.prefix}-lambda-cost-explorer"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ce:GetCostAndUsage"]
      Resource = "*"
    }]
  })
}

# ─── Admin IAM user for store management ──────────────────────────────────────
resource "aws_iam_user" "admin" {
  name = "${local.prefix}-admin"
  path = "/store/"
}

resource "aws_iam_user_policy" "admin" {
  name = "${local.prefix}-admin-policy"
  user = aws_iam_user.admin.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["dynamodb:*"]
        Resource = [
          aws_dynamodb_table.admins.arn,
          aws_dynamodb_table.products.arn,
          "${aws_dynamodb_table.products.arn}/index/*",
          aws_dynamodb_table.orders.arn,
          "${aws_dynamodb_table.orders.arn}/index/*",
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          aws_dynamodb_table.categories.arn,
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:*"]
        Resource = [aws_s3_bucket.images.arn, "${aws_s3_bucket.images.arn}/*", aws_s3_bucket.frontend.arn, "${aws_s3_bucket.frontend.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction", "lambda:GetFunctionConfiguration"]
        Resource = aws_lambda_function.backend.arn
      }
    ]
  })
}

resource "aws_iam_access_key" "admin" {
  user = aws_iam_user.admin.name
}
