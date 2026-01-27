#!/usr/bin/env bash
# Personalize template for new repository owner & name

source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

PROJECT_ROOT=$(get_project_root)

# Get repository owner and name from environment variables or arguments
REPO_OWNER="${REPO_OWNER:-${1:-}}"
REPO_NAME="${REPO_NAME:-${2:-}}"

if is_empty "$REPO_OWNER"; then
  fail "Repository owner not provided. Set REPO_OWNER env var or pass as first argument."
fi

if is_empty "$REPO_NAME"; then
  fail "Repository name not provided. Set REPO_NAME env var or pass as second argument."
fi

log_section "Personalizing repository for $REPO_OWNER/$REPO_NAME"

# Old and new values
OLD_OWNER="md-oss"
OLD_NAME="monorepo-template"
NEW_OWNER="${REPO_OWNER,,}" # Convert to lowercase, as GitHub usernames are case-insensitive and NPM doesn't allow uppercase in package scopes
NEW_NAME="$REPO_NAME"

# Files to search and replace in
FILE_PATTERNS=(
  "*.json"
  "*.ts"
  "*.tsx"
  "*.js"
  "*.jsx"
  "*.md"
  "*.hbs"
  "*.yaml"
  "*.yml"
)

# Build find command with all patterns
FIND_ARGS=()
for pattern in "${FILE_PATTERNS[@]}"; do
  FIND_ARGS+=(-o -name "$pattern")
done
# Remove the first -o
FIND_ARGS=("${FIND_ARGS[@]:1}")

log_info "Searching for files to personalize..."

# Find and replace in all matching files
replaced_count=0
while IFS= read -r -d '' file; do
  # Skip node_modules and other common ignored directories
  if [[ "$file" =~ (node_modules|\.git|dist|build|\.next|coverage) ]]; then
    continue
  fi
  
  # Check if file contains any old values
  if grep -q -E "($OLD_OWNER/$OLD_NAME|$OLD_OWNER|$OLD_NAME)" "$file" 2>/dev/null; then
    log_info "Updating: $file"
    
    # Use sed for in-place replacement
    # IMPORTANT: Order matters! Replace full slug first, then owner, then name
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS sed requires '' after -i
      sed -i '' \
        -e "s|$OLD_OWNER/$OLD_NAME|$NEW_OWNER/$NEW_NAME|g" \
        -e "s/$OLD_OWNER/$NEW_OWNER/g" \
        -e "s/$OLD_NAME/$NEW_NAME/g" \
        "$file"
    else
      # Linux sed
      sed -i \
        -e "s|$OLD_OWNER/$OLD_NAME|$NEW_OWNER/$NEW_NAME|g" \
        -e "s/$OLD_OWNER/$NEW_OWNER/g" \
        -e "s/$OLD_NAME/$NEW_NAME/g" \
        "$file"
    fi
    
    replaced_count=$((replaced_count + 1))
  fi
done < <(cd "$PROJECT_ROOT" && find . -type f \( "${FIND_ARGS[@]}" \) -print0 2>/dev/null)

if [[ $replaced_count -gt 0 ]]; then
  log_success "Personalized $replaced_count file(s) for $NEW_OWNER/$NEW_NAME"
else
  log_warning "No files found needing personalization"
fi

exit 0
