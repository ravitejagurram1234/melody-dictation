#!/usr/bin/env bash
set -euo pipefail

GH_TOKEN=""
GH_USER="ravitejagurram1234"
REPO="melody-dictation"
REMOTE_URL="https://${GH_TOKEN}@github.com/${GH_USER}/${REPO}.git"
PAGES_URL="https://${GH_USER}.github.io/${REPO}/"

if [ -z "${GH_TOKEN}" ]; then
  echo "❌  GH_TOKEN is empty. Edit deploy.sh and paste a GitHub PAT first."
  exit 1
fi

echo ""
echo "🎵  Melody Dictation — GitHub Deploy"
echo "──────────────────────────────────────"

echo ""
echo "▶  Step 1/4: Creating GitHub repository..."
HTTP_STATUS=$(curl -s -o /tmp/gh_create_response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"${REPO}\",
    \"description\": \"Melody Dictation — Hear it, replay it, master it. Train your musical ear with 5 instruments across 5 levels.\",
    \"homepage\": \"${PAGES_URL}\",
    \"private\": false,
    \"auto_init\": false
  }")

if [ "$HTTP_STATUS" = "201" ]; then
  echo "   ✅  Repository created: https://github.com/${GH_USER}/${REPO}"
elif [ "$HTTP_STATUS" = "422" ]; then
  echo "   ℹ️   Repository already exists — continuing..."
else
  echo "   ❌  Failed (HTTP $HTTP_STATUS)"
  cat /tmp/gh_create_response.json
  exit 1
fi

echo ""
echo "▶  Step 2/4: Initialising git..."

if [ -d ".git" ]; then
  echo "   ℹ️   Git already initialised — resetting remote..."
  git remote remove origin 2>/dev/null || true
else
  git init -b main
fi

git config user.email "deploy@melody-dictation"
git config user.name  "Melody Dictation Deploy"
git config http.postBuffer 524288000

echo ""
echo "▶  Step 3/4: Committing source files..."

# Clear token before committing
sed -i.bak 's|^GH_TOKEN="[^"]*"$|GH_TOKEN=""|' deploy.sh
rm -f deploy.sh.bak

git add .
git commit -m "feat: Melody Dictation — 5 instruments, 5 levels, Web Audio synthesis" --allow-empty

echo ""
echo "▶  Step 4/4: Pushing to GitHub..."
git remote add origin "${REMOTE_URL}"
git push -u origin main --force

echo ""
echo "▶  Enabling GitHub Pages..."
curl -s -o /dev/null -w "   Pages API: %{http_code}\n" \
  -X POST \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/${GH_USER}/${REPO}/pages" \
  -d '{"source":{"branch":"gh-pages","path":"/"}}'

echo ""
echo "════════════════════════════════════════"
echo "  ✅  All done!"
echo ""
echo "  📦  Repo : https://github.com/${GH_USER}/${REPO}"
echo "  🌐  Live : ${PAGES_URL}"
echo ""
echo "  GitHub Actions is building — live in ~2 minutes."
echo "════════════════════════════════════════"
echo ""
