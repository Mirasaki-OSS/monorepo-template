#!/usr/bin/env sh
set -eu

source_dir="${1:-/mnt/workspace}"
target_dir="${2:-/app}"

copy_manifest_glob() {
  glob="$1"

  for manifest in $glob; do
    [ -f "$manifest" ] || continue
    rel_path="${manifest#"$source_dir"/}"
    rel_dir="${rel_path%/package.json}"
    mkdir -p "$target_dir/$rel_dir"
    cp "$manifest" "$target_dir/$rel_path"
  done
}

copy_manifest_glob "$source_dir/apps/*/package.json"
copy_manifest_glob "$source_dir/packages/*/package.json"
copy_manifest_glob "$source_dir/vendor/*/package.json"
