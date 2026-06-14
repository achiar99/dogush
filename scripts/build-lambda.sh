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

# Copy compiled output
cp -r "$BACKEND/dist" "$PACKAGE_DIR/dist"

# Copy package files and install production deps only
cp "$BACKEND/package.json" "$PACKAGE_DIR/package.json"
cd "$PACKAGE_DIR"
npm install --omit=dev --ignore-scripts

echo "==> Lambda package ready: $PACKAGE_DIR"
