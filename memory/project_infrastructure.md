---
name: project-infrastructure
description: Dog pet store app AWS infrastructure — DynamoDB, Lambda, API Gateway, S3 setup
metadata:
  type: project
---

Pet store (dog food/accessories) app in Hebrew. Full-stack: React+Vite frontend, Express+TypeScript backend.

**AWS Architecture:**
- Lambda: backend Express app wrapped with `@vendia/serverless-express` — handler in `backend/src/lambda.ts`
- API Gateway: HTTP API v2 (`infra/api_gateway.tf`) — single `$default` route proxies all to Lambda
- DynamoDB tables: `dog-store-Admins`, `dog-store-Products`, `dog-store-Orders`, `dog-store-Users`
- S3: `dog-store-images-{accountId}` (product images, public), `dog-store-frontend-{accountId}` (static site)
- IAM: Lambda role with DynamoDB+S3 access; admin IAM user for store management

**Key env vars Lambda needs:**
`JWT_SECRET`, `PRODUCTS_TABLE`, `ORDERS_TABLE`, `ADMINS_TABLE`, `USERS_TABLE`, `IMAGES_BUCKET`, `IMAGES_BASE_URL`

**Deployment:**
1. `terraform init && terraform apply` (needs `TF_VAR_jwt_secret`, `TF_VAR_admin_password`)
2. `npm run seed-admin -w backend` + `npm run seed-products -w backend`
3. `VITE_API_BASE_URL=<api_url> npm run build -w frontend`
4. `aws s3 sync frontend/dist/ s3://<frontend_bucket>/`
Or: `./scripts/deploy.sh` does all of the above.

**Frontend API config:**
- Dev: Vite proxy `/api` → `localhost:5000`
- Prod: `VITE_API_BASE_URL` env var set to API Gateway URL at build time

**Why:** Products were hardcoded in `he.json` — moved to DynamoDB. Orders/AdminLogin were not wired to backend — now fully connected.
