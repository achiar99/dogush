variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name used as a prefix for resource names"
  type        = string
  default     = "pet-store"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "jwt_secret" {
  description = "JWT secret for admin authentication — set via TF_VAR_jwt_secret env var"
  type        = string
  sensitive   = true
}

variable "admin_username" {
  description = "Initial admin username — set via TF_VAR_admin_username env var"
  type        = string
  default     = "admin"
}

variable "admin_password" {
  description = "Initial admin password — set via TF_VAR_admin_password env var"
  type        = string
  sensitive   = true
}

variable "notification_email" {
  description = "Email to notify on new orders (leave empty to disable)"
  type        = string
  default     = ""
}

variable "whatsapp_phone" {
  description = "WhatsApp phone number in international format e.g. 972501234567"
  type        = string
  default     = ""
}

variable "telegram_bot_token" {
  description = "Telegram bot token from @BotFather"
  type        = string
  sensitive   = true
  default     = ""
}

variable "telegram_chat_id" {
  description = "Telegram group/chat ID to send notifications to"
  type        = string
  default     = ""
}
