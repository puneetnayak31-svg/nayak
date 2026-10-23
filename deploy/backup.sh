#!/usr/bin/env bash
# Back up everything the CMS writes that isn't in git (inbox submissions, the
# password hash and API key, version history) plus the content itself.
#
#   deploy/backup.sh [DEST]          # default DEST: /var/backups/hipl
#   15 3 * * * /srv/hipl/deploy/backup.sh >> /var/log/hipl-backup.log 2>&1
#
# Keeps 30 daily archives. The archives contain personal data (form
# submissions) and the API key: keep DEST private and copy it off the server.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-/var/backups/hipl}"
mkdir -p "$DEST"
chmod 700 "$DEST"
STAMP="$(date +%Y%m%d-%H%M%S)"
tar -czf "$DEST/hipl-$STAMP.tar.gz" -C "$REPO/hipl-website" \
  cms/state src/data src/pages assets/uploads
chmod 600 "$DEST/hipl-$STAMP.tar.gz"
ls -1t "$DEST"/hipl-*.tar.gz | tail -n +31 | xargs -r rm --
echo "$(date -Is) wrote $DEST/hipl-$STAMP.tar.gz"
