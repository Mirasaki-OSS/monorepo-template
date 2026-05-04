#!/usr/bin/env bash
# Main template preparation script
# Orchestrates all template preparation tasks when a repo is created from this template

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

REPO_OWNER="${REPO_OWNER:-${1:-}}"
REPO_NAME="${REPO_NAME:-${2:-}}"
PRESERVE_LIST="${PRESERVE_LIST:-${3:-}}"

log_section "Preparing repository from template"

# Preserve packages before cleanup
log_info "Preserving packages for template..."
REPO_OWNER="$REPO_OWNER" REPO_NAME="$REPO_NAME" PRESERVE_LIST="$PRESERVE_LIST" "$(dirname "${BASH_SOURCE[0]}")/preserve-packages.sh"

# Run cleanup to remove template-only files
log_info "Running cleanup task..."
"$(dirname "${BASH_SOURCE[0]}")/cleanup.sh"

# Personalize repository with new owner's namespace
log_info "Personalizing repository..."
REPO_OWNER="$REPO_OWNER" REPO_NAME="$REPO_NAME" "$(dirname "${BASH_SOURCE[0]}")/personalize.sh" "$REPO_OWNER" "$REPO_NAME"

# Remove transient node script used during personalization
RESTORE_SCOPE_SCRIPT="$(get_project_root)/scripts/node/restore-nonlocal-scoped-deps.mjs"
if file_exists "$RESTORE_SCOPE_SCRIPT"; then
  log_info "Removing temporary script: $RESTORE_SCOPE_SCRIPT"
  rm -f "$RESTORE_SCOPE_SCRIPT"
fi

# Regenerate lockfile after all manifest changes are finalized.
log_info "Regenerating package lockfile..."
cd "$(get_project_root)" || fail "Failed to change to project root"
pnpm install --lockfile-only --ignore-scripts

# Finally, let's remove scripts/bash/template itself
TEMPLATE_SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
if dir_exists "$TEMPLATE_SCRIPT_DIR"; then
  log_info "Removing template scripts directory: $TEMPLATE_SCRIPT_DIR"
  rm -rf "$TEMPLATE_SCRIPT_DIR"
fi

log_success "Template preparation completed!"

exit 0
