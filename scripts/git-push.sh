#!/bin/bash
set -e

REPO_DIR="/www/wwwroot/account.softcents.com"
cd "$REPO_DIR"

echo "=== Git Status ==="
git status -s

echo "=== Staging changes ==="
git add .

COMMIT_MSG="${1:-update: $(date +'%Y-%m-%d %H:%M:%S')}"
if git diff-index --quiet HEAD --; then
    echo "No changes to commit."
else
    echo "=== Committing changes: $COMMIT_MSG ==="
    git commit -m "$COMMIT_MSG"
fi

echo "=== Pushing to GitHub (main) ==="
git push origin main
echo "=== Successfully pushed to GitHub ==="
