#!/usr/bin/env bash
# Orchestrates workspace preservation for template preparation:
#
#   1. Resolve the preserve list (with transitive deps)  →  resolve-preserve-list.mjs
#   2. Copy preserved vendor/ packages into packages/ and strip publishing metadata
#   3. Remove unselected app workspaces
#   4. Rewrite vendor/ path references in config files   →  update-vendor-references.sh
#   5. Rewrite workspace: dep specs to pinned versions   →  rewrite-workspace-deps.mjs

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

PROJECT_ROOT=$(get_project_root)
export PROJECT_ROOT
PRESERVE_LIST="${PRESERVE_LIST:-${1:-}}"
NODE_SCRIPTS="$PROJECT_ROOT/scripts/node"

# Arrays populated in step 1
APPS_TO_PRESERVE=()
PACKAGES_TO_PRESERVE=()
VENDOR_PACKAGES_TO_PRESERVE=()   # bare names: "config" "design-system" etc.

# ============================================================================
# Step 1 - Resolve preserve list (with transitive workspace deps)
# ============================================================================

log_section "Step 1 - Resolving preserve list"
log_info "Input: ${PRESERVE_LIST:-(empty — using defaults)}"

declare -a resolve_args=("--project-root=$PROJECT_ROOT")
[[ -n "$PRESERVE_LIST" ]] && resolve_args+=("--preserve-list=$PRESERVE_LIST")

while IFS= read -r workspace; do
  [[ -z "$workspace" ]] && continue
  case "$workspace" in
    apps/*)     APPS_TO_PRESERVE+=("$workspace") ;;
    packages/*) PACKAGES_TO_PRESERVE+=("$workspace") ;;
    vendor/*)   VENDOR_PACKAGES_TO_PRESERVE+=("${workspace#vendor/}") ;;
  esac
done < <(node "$NODE_SCRIPTS/resolve-preserve-list.mjs" "${resolve_args[@]}")

log_info "Apps to keep:             ${APPS_TO_PRESERVE[*]:-<none>}"
log_info "packages/ to keep:        ${PACKAGES_TO_PRESERVE[*]:-<none>}"
log_info "vendor/ packages to copy: ${VENDOR_PACKAGES_TO_PRESERVE[*]:-<none>}"

# ============================================================================
# Step 2 - Copy preserved vendor/ packages into packages/
# ============================================================================

log_section "Step 2 - Copying preserved vendor packages to packages/"

preserve_count=0
for package in "${VENDOR_PACKAGES_TO_PRESERVE[@]}"; do
  src="$PROJECT_ROOT/vendor/$package"
  dest="$PROJECT_ROOT/packages/$package"

  if ! dir_exists "$src"; then
    log_warning "vendor/$package not found, skipping..."
    continue
  fi

  if dir_exists "$dest"; then
    fail "Cannot copy vendor/$package: packages/$package already exists."
  fi

  log_info "Copying vendor/$package → packages/$package..."
  cp -r "$src" "$dest"

  log_info "Stripping publishing metadata from packages/$package/package.json..."
  node "$NODE_SCRIPTS/strip-vendor-pkg-metadata.mjs" --pkg="$dest/package.json"

  if file_exists "$dest/LICENSE"; then
    rm -f "$dest/LICENSE"
    log_info "Removed LICENSE from packages/$package"
  fi

  log_success "Preserved vendor/$package → packages/$package"
  preserve_count=$((preserve_count + 1))
done

[[ $preserve_count -eq 0 ]] \
  && log_warning "No vendor packages were preserved" \
  || log_success "Preserved $preserve_count vendor package(s)"

# ============================================================================
# Step 3 - Remove unselected app workspaces
# ============================================================================

log_section "Step 3 - Pruning unselected app workspaces"

declare -A app_lookup=()
for app in "${APPS_TO_PRESERVE[@]}"; do
  app_lookup["$app"]=1
done

removed_apps=0
while IFS= read -r name; do
  [[ -z "$name" ]] && continue
  workspace="apps/$name"
  if [[ -n "${app_lookup[$workspace]:-}" ]]; then
    log_info "Keeping  $workspace"
  else
    log_info "Removing $workspace"
    rm -rf "$PROJECT_ROOT/$workspace"
    removed_apps=$((removed_apps + 1))
  fi
done < <(find "$PROJECT_ROOT/apps" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' | sort)

[[ $removed_apps -gt 0 ]] \
  && log_success "Removed $removed_apps app workspace(s)" \
  || log_info "No app workspaces removed"

# ============================================================================
# Step 4 - Rewrite vendor/ → packages/ path references in config files
# ============================================================================

log_section "Step 4 - Updating vendor/ → packages/ path references"

"$(dirname "${BASH_SOURCE[0]}")/update-vendor-references.sh" "${VENDOR_PACKAGES_TO_PRESERVE[@]}"

# ============================================================================
# Step 5 - Rewrite workspace: dep specs to pinned published versions
# ============================================================================

log_section "Step 5 - Rewriting workspace: dependency specs"

node "$NODE_SCRIPTS/rewrite-workspace-deps.mjs" --project-root="$PROJECT_ROOT"
log_success "Workspace dependency specs rewritten"

exit 0
