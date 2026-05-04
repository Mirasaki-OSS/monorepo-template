#!/usr/bin/env bash
# Rewrites "vendor/<name>" path strings to "packages/<name>" across config files
# for every vendor package that was preserved (copied to packages/).
#
# Must be called after the preserved vendor packages have been copied in step 2
# of preserve-packages.sh, so that packages/* files are already in place.
#
# Usage: update-vendor-references.sh <package-name> [<package-name> ...]
#
# Arguments:
#   $@  Bare package names to rewrite, e.g. "config" "design-system"
#
# Required env:
#   PROJECT_ROOT  Absolute path to the repository root

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

: "${PROJECT_ROOT:?PROJECT_ROOT must be set}"
VENDOR_PACKAGES=("$@")

if [[ ${#VENDOR_PACKAGES[@]} -eq 0 ]]; then
  log_info "No vendor packages to update references for"
  exit 0
fi

# Config files that may contain literal "vendor/<package>" path strings
STATIC_FILES=(
  "README.md"
  "biome.json"
  "docker/compose.dev.yaml"
  "docker/Dockerfile"
  "docker/Dockerfile.dev"
)

# Dynamically find all package.json and CHANGELOG.md under packages/ and apps/
# (at this point, removed apps are already gone so only preserved apps remain)
dynamic_files=()
for pattern in "package.json" "CHANGELOG.md"; do
  while IFS= read -r match; do
    dynamic_files+=("${match#"$PROJECT_ROOT/"}")
  done < <(find "$PROJECT_ROOT/packages" "$PROJECT_ROOT/apps" -type f -name "$pattern" 2>/dev/null | sort)
done

ALL_FILES=("${STATIC_FILES[@]}" "${dynamic_files[@]}")

update_count=0
for file_path in "${ALL_FILES[@]}"; do
  target="$PROJECT_ROOT/$file_path"
  if ! file_exists "$target"; then
    log_warning "$file_path not found, skipping..."
    continue
  fi

  for package in "${VENDOR_PACKAGES[@]}"; do
    sed -i.bak "s|vendor/$package|packages/$package|g" "$target"
  done
  rm -f "$target.bak"

  log_info "Updated $file_path"
  update_count=$((update_count + 1))
done

[[ $update_count -gt 0 ]] \
  && log_success "Updated $update_count file(s)" \
  || log_warning "No files were updated"

exit 0