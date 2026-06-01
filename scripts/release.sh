#!/usr/bin/env bash
set -euo pipefail

retry=false
for arg in "$@"; do
  case "$arg" in
    --retry | -r) retry=true ;;
  esac
done

version=$(npm pkg get version | tr -d '"')
[ -n "$version" ] || { echo "Could not read version from package.json" >&2; exit 1; }
VERSION="v$version"

git push origin main

if [ "$retry" = true ]; then
  gh release delete "$VERSION" --yes 2>/dev/null || true
  git tag -f "$VERSION"
  git push origin "$VERSION" --force
else
  # Normal flow expects `npm version` to have already created $VERSION locally.
  git push origin "$VERSION"
fi

gh release create "$VERSION" --title "$VERSION" --generate-notes
