#!/usr/bin/env bash
# Template cleanup script
# Removes files listed in .github/.template-ignore
# This script is reusable and can be called from GitHub Actions or locally

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

PROJECT_ROOT=$(get_project_root)
TEMPLATE_IGNORE_FILE="$PROJECT_ROOT/.github/.template-ignore"

# Verify required file exists
require_file "$TEMPLATE_IGNORE_FILE"

log_section "Cleaning up template files"

# Read the .template-ignore file line by line
removed_count=0
while IFS= read -r line; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  
  # Trim whitespace
  pattern=$(trim "$line")
  
  # Expand pattern and remove matching files/directories
  if ! is_empty "$pattern"; then
    # Use find with globstar-like expansion
    while IFS= read -r -d '' item; do
      if path_exists "$item"; then
        log_success "Removing: $item"
        rm -rf "$item"
        removed_count=$((removed_count + 1))
      fi
    done < <(cd "$PROJECT_ROOT" && find . -maxdepth 2 -name "$(basename "$pattern")" -print0 2>/dev/null || true)
    
    # Also try direct path removal (for exact paths)
    if path_exists "$PROJECT_ROOT/$pattern"; then
      log_success "Removing: $pattern"
      rm -rf "$PROJECT_ROOT/$pattern"
      removed_count=$((removed_count + 1))
    fi
  fi
done < "$TEMPLATE_IGNORE_FILE"

if [[ $removed_count -gt 0 ]]; then
  log_success "Successfully removed $removed_count item(s)"
else
  log_warning "No files matched for removal"
fi

exit 0
