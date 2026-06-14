output "api_url" {
  description = "API Gateway endpoint URL — use this as VITE_API_BASE_URL when building the frontend"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "frontend_bucket" {
  description = "S3 bucket name for frontend deployment"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_url" {
  description = "CloudFront HTTPS URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "images_bucket" {
  description = "S3 bucket name for product images"
  value       = aws_s3_bucket.images.bucket
}

output "images_base_url" {
  description = "Base URL for product images"
  value       = "https://${aws_s3_bucket.images.bucket_regional_domain_name}"
}

output "admin_iam_access_key" {
  description = "Admin IAM user access key ID"
  value       = aws_iam_access_key.admin.id
}

output "admin_iam_secret_key" {
  description = "Admin IAM user secret key — save this, it is shown only once"
  value       = aws_iam_access_key.admin.secret
  sensitive   = true
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    admins   = aws_dynamodb_table.admins.name
    products = aws_dynamodb_table.products.name
    orders   = aws_dynamodb_table.orders.name
    users    = aws_dynamodb_table.users.name
  }
}
