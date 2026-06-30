# Dogush Pet Store

Full-stack pet food store — Hebrew RTL frontend, serverless backend on AWS.

**Production:** https://dogush.co.il

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + TypeScript + Vite (RTL/Hebrew) |
| Backend | Node.js + Express, deployed as AWS Lambda |
| Infrastructure | Terraform (S3, CloudFront, API Gateway, DynamoDB, Route53, ACM) |
| CI/CD | GitHub Actions — tests on every PR, deploy to prod on merge to main |

## Monorepo structure

```
frontend/   React app
backend/    Lambda API
infra/      Terraform (workspaces: dev / prod)
scripts/    deploy.sh (dev), build-lambda.sh
shared/     he.json — product catalog + config
```

## Local development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Running tests

```bash
npm test              # backend unit tests (Vitest)
npm run typecheck     # TypeScript check (frontend + backend)
```

## Deploying to dev

Requires AWS SSO login and env vars:

```bash
aws sso login --profile AdministratorAccess-271691290266
export TF_VAR_jwt_secret=...
export TF_VAR_admin_password=...
./scripts/deploy.sh dev
```

## Deploying to prod

Prod deploys automatically on every merge to `main` via GitHub Actions.
Manual prod deploys are not recommended.

## Workflow

- Work on feature branches
- Open a PR → CI runs typecheck + backend tests (required to merge)
- Merge to `main` → auto-deploy to https://dogush.co.il
