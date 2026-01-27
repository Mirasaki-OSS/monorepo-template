#!/usr/bin/env bash
# Main template preparation script
# Orchestrates all template preparation tasks when a repo is created from this template

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

log_section "Preparing repository from template"

# Preserve packages before cleanup
log_info "Preserving packages for template..."
"$(dirname "${BASH_SOURCE[0]}")/preserve-packages.sh"

# Run cleanup to remove template-only files
log_info "Running cleanup task..."
"$(dirname "${BASH_SOURCE[0]}")/cleanup.sh"

# Regenerate lockfile after removing vendor/*
log_info "Regenerating package lockfile..."
cd "$(get_project_root)" || fail "Failed to change to project root"
pnpm install --lockfile-only --ignore-scripts

# Personalize repository with new owner's namespace
log_info "Personalizing repository..."
"$(dirname "${BASH_SOURCE[0]}")/personalize.sh" "$REPO_OWNER" "$REPO_NAME"

# Finally, let's remove scripts/bash/template itself
TEMPLATE_SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
if dir_exists "$TEMPLATE_SCRIPT_DIR"; then
  log_info "Removing template scripts directory: $TEMPLATE_SCRIPT_DIR"
  rm -rf "$TEMPLATE_SCRIPT_DIR"
fi

log_success "Template preparation completed!"

exit 0
