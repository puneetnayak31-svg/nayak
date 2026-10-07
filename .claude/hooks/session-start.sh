#!/bin/bash
# Installs the video tooling: Pillow and numpy for the Python reels pipeline
# (reels/), and Remotion for React-based animation. ffmpeg and Chromium come
# with the cloud container.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

python3 -m pip install --quiet --disable-pip-version-check --root-user-action=ignore -r reels/requirements.txt
npm install --no-audit --no-fund --loglevel=error

command -v ffmpeg >/dev/null || echo "warning: ffmpeg is not installed" >&2
