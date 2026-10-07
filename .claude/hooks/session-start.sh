#!/bin/bash
# Installs the video tooling: Pillow and numpy for the Python reels pipeline
# (reels/), Remotion (React) and HyperFrames (HTML) for animation, and the
# headless Chrome HyperFrames renders with. ffmpeg comes with the container.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

python3 -m pip install --quiet --disable-pip-version-check --root-user-action=ignore -r reels/requirements.txt -r gobrandtoday/requirements.txt
npm install --no-audit --no-fund --loglevel=error
npx --no-install hyperframes browser ensure >/dev/null

# The HyperFrames skills live in .claude/skills; stop `hyperframes init` from
# installing another copy into the user's global skills folder.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo 'export HYPERFRAMES_SKIP_SKILLS=1' >> "$CLAUDE_ENV_FILE"
fi

command -v ffmpeg >/dev/null || echo "warning: ffmpeg is not installed" >&2
