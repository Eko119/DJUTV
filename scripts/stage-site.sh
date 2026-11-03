#!/usr/bin/env bash
# Builds what gets published from one explicit list of site files, so nothing else in the
# repository (this script, the README, the old preview folder on gh-pages) can ride along.
#
#   scripts/stage-site.sh preview OUT.zip   noindex copy of the site for the Cloudflare preview
#                                           Worker, zipped outside the repository
#   scripts/stage-site.sh pages             stage the next gh-pages commit on the local branch
#                                           gh-pages-staged; extra arguments go to git commit
#   scripts/stage-site.sh check [URL]       compare a live site with origin/gh-pages and confirm
#                                           that no non-site path is reachable
#
# None of these pushes, touches main, or changes a setting. Publishing stays a separate step:
#   git push origin gh-pages-staged:gh-pages
set -euo pipefail

SITE=(index.html privacy.html assets CNAME .nojekyll)  # everything GitHub Pages should serve
PREVIEW=(index.html privacy.html assets)                # the preview Worker needs no CNAME/.nojekyll
SITE_RE='^(index\.html|privacy\.html|assets/.*|CNAME|\.nojekyll)$'

die() { echo "stage-site: $*" >&2; exit 1; }
cd "$(git rev-parse --show-toplevel)"
# Builds come from committed files only (git archive), so only uncommitted edits can mislead.
[ -z "$(git status --porcelain --untracked-files=no)" ] || die "commit your changes first, so the build matches a commit"
src=$(git rev-parse --short HEAD)

case "${1:-}" in
preview)
  out=${2:-}; [ -n "$out" ] || die "usage: scripts/stage-site.sh preview OUT.zip"
  out=$(realpath -m "$out")
  case "$out" in "$PWD"/*) die "write the zip outside the repository so it can't be committed";; esac
  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  git archive HEAD "${PREVIEW[@]}" | tar -x -C "$tmp"
  # A preview must not compete with the real site in search: no canonical, no og:url, noindex.
  python3 - "$tmp" <<'PY'
import pathlib, re, sys
for page in sorted(pathlib.Path(sys.argv[1]).glob("*.html")):
    html = page.read_text(encoding="utf-8")
    html = re.sub(r'\n<link rel="canonical"[^>]*>', "", html)
    html = re.sub(r'\n<meta property="og:url"[^>]*>', "", html)
    robots = '<meta name="robots" content="noindex, nofollow">'
    if 'name="robots"' in html:
        html = re.sub(r'<meta name="robots" content="[^"]*">', robots, html)
    else:
        theme = '<meta name="theme-color" content="#0A0C12">'
        html = html.replace(theme, theme + "\n" + robots, 1)
    if 'rel="canonical"' in html or "og:url" in html or robots not in html:
        sys.exit(f"stage-site: could not turn {page.name} into a noindex preview")
    page.write_text(html, encoding="utf-8")
PY
  rm -f "$out"
  (cd "$tmp" && python3 -m zipfile -c "$out" "${PREVIEW[@]}")
  echo "noindex preview of $src written to $out"
  ;;

pages)
  git fetch -q origin gh-pages
  wt=$(mktemp -d)
  git worktree add -q --detach "$wt" origin/gh-pages
  trap 'git worktree remove --force "$wt"' EXIT
  # Start from an empty tree on top of gh-pages history, then add only the site files, so
  # anything gh-pages held before (the README, the old preview folder) is deleted, not kept.
  git -C "$wt" rm -rq --ignore-unmatch .
  git archive HEAD "${SITE[@]}" | tar -x -C "$wt"
  git -C "$wt" add -A
  extra=$(git -C "$wt" ls-files | grep -vE "$SITE_RE" || true)
  [ -z "$extra" ] || die "refusing to stage non-site files: $extra"
  ! git -C "$wt" diff --cached --quiet || die "gh-pages already matches $src; nothing to stage"
  git -C "$wt" commit -q -m "Publish the site from $src" "${@:2}"
  git branch -f gh-pages-staged "$(git -C "$wt" rev-parse HEAD)"
  echo "staged gh-pages-staged on top of origin/gh-pages ($(git rev-parse --short origin/gh-pages)):"
  git diff --stat origin/gh-pages gh-pages-staged
  echo "publish deliberately with: git push origin gh-pages-staged:gh-pages"
  ;;

check)
  url=${2:-https://djugocrazy.com}
  git fetch -q origin gh-pages
  status=0
  # Every site file on gh-pages should be served byte for byte.
  for f in $(git ls-tree -r --name-only origin/gh-pages | grep -E "$SITE_RE" | grep -vE '^(CNAME|\.nojekyll)$'); do
    if curl -fsS --max-time 20 "$url/$f" 2>/dev/null | cmp -s - <(git show "origin/gh-pages:$f"); then
      echo "ok       /$f matches origin/gh-pages"
    else
      echo "STALE    /$f does not match origin/gh-pages"; status=1
    fi
  done
  # Every non-site path that exists on this branch or ever existed on gh-pages must be absent.
  for p in $( { git ls-tree -r --name-only HEAD; git log --format= --name-only origin/gh-pages; } | grep -v '^$' | sort -u | grep -vE "$SITE_RE"); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url/$p")
    if [ "$code" = 404 ]; then echo "ok       /$p is not served"; else echo "EXPOSED  /$p answers HTTP $code"; status=1; fi
  done
  exit "$status"
  ;;

*)
  sed -n '2,13p' "$0"; exit 2
  ;;
esac
