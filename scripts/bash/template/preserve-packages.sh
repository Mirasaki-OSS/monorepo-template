#!/usr/bin/env bash
# Preserve packages script
# Copies vendor packages to packages/ for template users
# This runs before cleanup to preserve certain packages for the template

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

PROJECT_ROOT=$(get_project_root)

# List of packages to preserve from vendor/ to packages/
# Add package names here to automatically copy and configure them
PACKAGES_TO_PRESERVE=(
  "config"
)

# List of files to update vendor/ references to packages/
# Add relative paths from project root to automatically update references
FILES_TO_UPDATE=(
  "README.md"
  "apps/cli/package.json"
  "docker/compose.dev.yaml"
  "docker/Dockerfile"
  "docker/Dockerfile.dev"
)

log_section "Preserving packages for template"

preserve_count=0

for package in "${PACKAGES_TO_PRESERVE[@]}"; do
  VENDOR_PACKAGE="$PROJECT_ROOT/vendor/$package"
  PACKAGES_PACKAGE="$PROJECT_ROOT/packages/$package"
  
  if ! dir_exists "$VENDOR_PACKAGE"; then
    log_warning "vendor/$package not found, skipping..."
    continue
  fi
  
  log_info "Copying vendor/$package to packages/$package..."
  cp -r "$VENDOR_PACKAGE" "$PACKAGES_PACKAGE"
  log_success "Copied vendor/$package to packages/$package"
  
  # Modify package.json to make it template-friendly
  PACKAGE_JSON="$PACKAGES_PACKAGE/package.json"
  if file_exists "$PACKAGE_JSON"; then
    log_info "Updating packages/$package/package.json..."
    
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$PACKAGE_JSON', 'utf8'));
      pkg.private = true;
      delete pkg.publishConfig;
      delete pkg.repository;
      delete pkg.license;
      if (Array.isArray(pkg.files)) {
        pkg.files = pkg.files.filter((entry) => entry !== 'LICENSE');
      }
      fs.writeFileSync('$PACKAGE_JSON', JSON.stringify(pkg, null, '\t') + '\n');
    "
    
    log_success "Updated package.json (set private=true, removed publishConfig, repository and licensing)"
  else
    log_warning "package.json not found in packages/$package"
  fi

  # Remove LICENSE file if exists
  LICENSE_FILE="$PACKAGES_PACKAGE/LICENSE"
  if file_exists "$LICENSE_FILE"; then
    log_info "Removing LICENSE file from packages/$package..."
    rm -f "$LICENSE_FILE"
    log_success "Removed LICENSE file from packages/$package"
  fi
  
  preserve_count=$((preserve_count + 1))
done

# Update references in configured files to point to packages/ instead of vendor/
log_info "Updating file references from vendor/ to packages/..."
update_count=0

for file_path in "${FILES_TO_UPDATE[@]}"; do
  TARGET_FILE="$PROJECT_ROOT/$file_path"
  
  if ! file_exists "$TARGET_FILE"; then
    log_warning "$file_path not found, skipping..."
    continue
  fi
  
  log_info "Updating $file_path..."
  for package in "${PACKAGES_TO_PRESERVE[@]}"; do
    sed -i.bak "s|vendor/$package|packages/$package|g" "$TARGET_FILE"
  done
  rm -f "$TARGET_FILE.bak"
  
  update_count=$((update_count + 1))
done

if [ "$update_count" -gt 0 ]; then
  log_success "Updated $update_count file(s)"
fi

if [ "$preserve_count" -eq 0 ]; then
  log_warning "No packages were preserved"
else
  log_success "Preserved $preserve_count package(s)"
fi

exit 0
