#!/usr/bin/env bash
# The preview must not be able to express a colour the export can't.
# Any literal in a preview context means the canvas is lying about the system.
set -euo pipefail

hits=$(grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(' src/app/preview/contexts/ || true)

if [ -n "$hits" ]; then
    echo "Colour literals found in preview contexts — use var(--token) only:"
    echo "$hits"
    exit 1
fi

echo "Preview contexts are token-only."
