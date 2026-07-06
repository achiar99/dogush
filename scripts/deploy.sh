#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh <dev|prod>
set -euo pipefail

ENV="${1:-dev}"
if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Usage: $0 <dev|prod>"
  exit 1
fi

export AWS_PROFILE="${AWS_PROFILE:-AdministratorAccess-271691290266}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA="$REPO_ROOT/infra"
TFVARS="$INFRA/env/${ENV}.tfvars"

: "${TF_VAR_jwt_secret:?Set TF_VAR_jwt_secret}"
: "${TF_VAR_admin_password:?Set TF_VAR_admin_password}"

echo "==> Deploying environment: $ENV"

# ── 1. Select Terraform workspace ───────────────────────────────────────────
cd "$INFRA"
terraform init -upgrade
terraform workspace select "$ENV" 2>/dev/null || terraform workspace new "$ENV"

# ── 2. Terraform apply ───────────────────────────────────────────────────────
echo "==> terraform apply ($ENV)..."
terraform apply -var-file="$TFVARS" -var="aws_profile=${AWS_PROFILE}" -auto-approve

# ── 3. Extract outputs ───────────────────────────────────────────────────────
API_URL=$(terraform output -raw api_url)
FRONTEND_BUCKET=$(terraform output -raw frontend_bucket)

echo "API URL:          $API_URL"
echo "Frontend bucket:  $FRONTEND_BUCKET"

# ── 4. Seed admin + products ─────────────────────────────────────────────────
echo "==> Seeding admin user..."
cd "$REPO_ROOT"
npm run seed-admin -w backend

echo "==> Seeding products..."
npm run seed-products -w backend

# ── 5. Build frontend ────────────────────────────────────────────────────────
echo "==> Building frontend for $ENV..."
VITE_API_BASE_URL="$API_URL" npm run build -w frontend

# ── 6. Sync to S3 ────────────────────────────────────────────────────────────
echo "==> Deploying frontend to S3 ($FRONTEND_BUCKET)..."
aws s3 sync "$REPO_ROOT/frontend/dist/" "s3://$FRONTEND_BUCKET/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

aws s3 cp "$REPO_ROOT/frontend/dist/index.html" "s3://$FRONTEND_BUCKET/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

FRONTEND_URL=$(terraform -chdir="$INFRA" output -raw frontend_url)
echo ""
echo "✓ $ENV deployment complete!"
echo "  Frontend: $FRONTEND_URL"
echo "  API:      $API_URL"
