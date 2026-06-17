# ── Route 53 hosted zone (created once, shared by dev + prod) ─────────────────
# Only create in prod workspace — dev reuses the same zone via a data source.

resource "aws_route53_zone" "main" {
  count = var.environment == "prod" ? 1 : 0
  name  = "dogush.co.il"
  tags  = { Name = "dogush.co.il" }
}

# In dev workspace, look up the zone that prod already created.
data "aws_route53_zone" "main" {
  count        = var.environment == "dev" ? 1 : 0
  name         = "dogush.co.il."
  private_zone = false
}

locals {
  zone_id = var.environment == "prod" ? aws_route53_zone.main[0].zone_id : data.aws_route53_zone.main[0].zone_id
}

# ── ACM certificate (must be us-east-1 for CloudFront) ────────────────────────
# Also created once in prod; dev reuses via data source.

provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = "AdministratorAccess-271691290266"
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

resource "aws_acm_certificate" "cert" {
  count                     = var.environment == "prod" ? 1 : 0
  provider                  = aws.us_east_1
  domain_name               = "dogush.co.il"
  subject_alternative_names = ["*.dogush.co.il"]
  validation_method         = "DNS"

  lifecycle { create_before_destroy = true }
}

# DNS validation records for the cert — deduplicate by record name (dogush.co.il and *.dogush.co.il share one CNAME)
resource "aws_route53_record" "cert_validation" {
  for_each = var.environment == "prod" ? {
    for dvo in aws_acm_certificate.cert[0].domain_validation_options : dvo.resource_record_name => dvo...
  } : {}

  zone_id         = local.zone_id
  name            = each.value[0].resource_record_name
  type            = each.value[0].resource_record_type
  ttl             = 60
  records         = [each.value[0].resource_record_value]
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cert" {
  count                   = var.environment == "prod" ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert[0].arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]

  timeouts {
    create = "45m"
  }
}

# In dev, look up the validated cert that prod created
data "aws_acm_certificate" "cert" {
  count    = var.environment == "dev" ? 1 : 0
  provider = aws.us_east_1
  domain   = "dogush.co.il"
  statuses = ["ISSUED"]
}

locals {
  cert_arn = var.environment == "prod" ? aws_acm_certificate_validation.cert[0].certificate_arn : data.aws_acm_certificate.cert[0].arn
}

# ── Route 53 A records (alias to CloudFront) ──────────────────────────────────
locals {
  domain = var.environment == "prod" ? "dogush.co.il" : "dev.dogush.co.il"
}

resource "aws_route53_record" "frontend" {
  zone_id = local.zone_id
  name    = local.domain
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
