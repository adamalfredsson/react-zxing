#!/usr/bin/env bash
set -euo pipefail

VERSION=v$(npm version | grep react-zxing | cut -d"'" -f 4)

git push origin main "$VERSION"
gh release create "$VERSION" --title "$VERSION" --generate-notes
