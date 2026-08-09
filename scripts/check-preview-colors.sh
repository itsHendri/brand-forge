#!/usr/bin/env bash
# The preview must not be able to express a colour the export can't.
# Any literal in a preview context means the canvas is lying about the system.
set -euo pipefail

# The whole preview tree, not just contexts/ — the shared kit is where most
# colour now lives, and it was outside the net until it wasn't.
hits=$(grep -rnE '#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(' src/app/preview/ || true)

if [ -n "$hits" ]; then
    echo "Colour literals found in the preview — use var(--token) only:"
    echo "$hits"
    exit 1
fi

echo "Preview contexts are token-only."
