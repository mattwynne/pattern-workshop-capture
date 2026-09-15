#!/usr/bin/env bash
set -euo pipefail
# CI runs on Linux amd64; use an installed actionlint on other platforms.
if command -v actionlint >/dev/null; then
  actionlint
else
  [[ "$(uname -s)" == Linux && "$(uname -m)" == x86_64 ]] || {
    echo 'Install actionlint 1.7.12 on this platform, then rerun.' >&2; exit 1;
  }
  CHECK_DIR="$(mktemp -d)"
  trap 'rm -rf "$CHECK_DIR"' EXIT
  curl --fail --silent --show-error --location --connect-timeout 10 --max-time 60 \
    https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz \
    --output "$CHECK_DIR/actionlint.tar.gz"
  (cd "$CHECK_DIR" && echo '8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8  actionlint.tar.gz' | sha256sum --check)
  tar xzf "$CHECK_DIR/actionlint.tar.gz" -C "$CHECK_DIR" actionlint
  "$CHECK_DIR/actionlint"
fi
bash -n scripts/bootstrap-google-cloud.sh scripts/check-container.sh scripts/check-workflow.sh
