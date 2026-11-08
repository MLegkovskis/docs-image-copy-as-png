#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
version=$(jq -er '.version' "$repo_root/manifest.json")
package_name="docs-image-copy-as-png-${version}.zip"
output_dir="$repo_root/dist"
output_path="$output_dir/$package_name"

mkdir -p "$output_dir"
if [[ -e "$output_path" ]]; then
  echo "Package already exists: $output_path" >&2
  exit 1
fi

(
  cd "$repo_root"
  zip -q -r "$output_path" \
    manifest.json \
    background.js \
    content.js \
    icons \
    PRIVACY.md \
    README.md \
    LICENSE
)

unzip -t "$output_path" >/dev/null
printf '%s\n' "$output_path"
