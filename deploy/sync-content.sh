#!/usr/bin/env bash
# Commit what editors changed in the hosted CMS back to git, and push.
#
#   deploy/sync-content.sh            # run on the server, from anywhere
#   */30 * * * * /srv/hipl/deploy/sync-content.sh >> /var/log/hipl-sync.log 2>&1
#
# Commits only content: src/data, src/pages, assets/uploads and the rebuilt dist/.
# The server needs push access (a deploy key with write access, or a token).
# Branch: $HIPL_CONTENT_BRANCH, default the branch currently checked out.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"
BRANCH="${HIPL_CONTENT_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"
PATHS=(hipl-website/src/data hipl-website/src/pages hipl-website/assets/uploads hipl-website/dist)

python3 hipl-website/build.py >/dev/null

if [ -z "$(git status --porcelain -- "${PATHS[@]}")" ]; then
  echo "$(date -Is) no content changes"
  exit 0
fi

git add -- "${PATHS[@]}"
git -c user.name="${HIPL_GIT_NAME:-HIPL CMS}" -c user.email="${HIPL_GIT_EMAIL:-cms@localhost}" \
  commit -q -m "Content update from the CMS ($(date '+%Y-%m-%d %H:%M'))"
git pull -q --no-rebase origin "$BRANCH"
git push -q origin "HEAD:$BRANCH"
echo "$(date -Is) pushed content to $BRANCH"
