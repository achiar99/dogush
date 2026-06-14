resource "aws_sns_topic" "new_order" {
  name = "${local.prefix}-new-order"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.notification_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.new_order.arn
  protocol  = "email"
  endpoint  = var.notification_email
}
