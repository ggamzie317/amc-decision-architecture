#!/usr/bin/env bash
set -u

echo "English-first launch residue scan (review-only)"
echo "Matches are review candidates. This script exits 0 even when matches are found."
echo

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR" || exit 0

if command -v rg >/dev/null 2>&1; then
  rg --line-number --color never --pcre2 \
    --glob '!/.git/**' \
    --glob '!/node_modules/**' \
    --glob '!/output/**' \
    --glob '!/dist/**' \
    --glob '!/build/**' \
    --glob '!/.next/**' \
    --glob '!/coverage/**' \
    --glob '!/.cache/**' \
    --glob '!/manus-ui/node_modules/**' \
    --glob '!/manus-ui/.next/**' \
    "(?:[\\p{Hangul}]|[\\p{Han}]|\\bko\\b|\\bzh\\b|LanguageToggle|selected language|report language)" \
    src docs prompts templates manus-ui examples fixtures schemas tasks scripts tests README.md || true
else
  grep -RInE \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=output \
    --exclude-dir=dist \
    --exclude-dir=build \
    --exclude-dir=.next \
    --exclude-dir=coverage \
    --exclude-dir=.cache \
    --exclude-dir=manus-ui/node_modules \
    --exclude-dir=manus-ui/.next \
    "LanguageToggle|selected language|report language|\\<ko\\>|\\<zh\\>" \
    src docs prompts templates manus-ui examples fixtures schemas tasks scripts tests README.md || true
fi

echo
echo "Scan complete."
exit 0
