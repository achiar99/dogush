#!/usr/bin/env bash
# Builds the backend TypeScript and packages it for Lambda deployment.
# Output: backend/lambda-package/ (ready to zip by Terraform)
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$REPO_ROOT/backend"
PACKAGE_DIR="$BACKEND/lambda-package"

echo "==> Building backend TypeScript..."
cd "$BACKEND"
npm install
npm run build

echo "==> Assembling Lambda package at $PACKAGE_DIR..."
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Mirror the source tree so that ../../shared/he.json paths resolve correctly.
# In Lambda: /var/task/backend/dist/app.js → ../../shared/he.json → /var/task/shared/he.json
mkdir -p "$PACKAGE_DIR/backend"
cp -r "$BACKEND/dist" "$PACKAGE_DIR/backend/dist"

# shared/he.json required by compiled backend code
mkdir -p "$PACKAGE_DIR/shared"
cp "$REPO_ROOT/shared/he.json" "$PACKAGE_DIR/shared/he.json"

# node_modules at the package root so Lambda can find them from backend/dist/
cp "$BACKEND/package.json" "$PACKAGE_DIR/package.json"
cd "$PACKAGE_DIR"
npm install --omit=dev --ignore-scripts

echo "==> Lambda package ready: $PACKAGE_DIR"
