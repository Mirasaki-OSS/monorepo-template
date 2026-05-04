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
OLD_OWNERS=(
  "md-oss"
  "mirasaki-oss"
)
OLD_NAME="monorepo-template"
NEW_OWNER="${REPO_OWNER,,}" # Convert to lowercase, as GitHub usernames are case-insensitive and NPM doesn't allow uppercase in package scopes
NEW_NAME="$REPO_NAME"

# Replacers for my-app / my_app / my app placeholders.
# Value is based on the repository ref (<owner>/<name>) and normalized to the placeholder's delimiter style.
NEW_REF_RAW="$NEW_OWNER/$NEW_NAME"
NEW_REF_HYPHEN="$(printf '%s' "$NEW_REF_RAW" | tr '[:upper:]' '[:lower:]' | sed -E 's#[/_ ]+#-#g')"
NEW_REF_UNDERSCORE="$(printf '%s' "$NEW_REF_RAW" | tr '[:upper:]' '[:lower:]' | sed -E 's#[-/ ]+#_#g')"
NEW_REF_SPACE="$(printf '%s' "$NEW_REF_RAW" | tr '[:upper:]' '[:lower:]' | sed -E 's#[-_/]+# #g')"
NEW_REF_TITLE="$(printf '%s' "$NEW_REF_SPACE" | awk '{for (i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)}1')"

OLD_OWNERS_REGEX="$(IFS='|'; echo "${OLD_OWNERS[*]}")"

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
  "*.example"
  "*.config.mjs"
  "*.css"
  "*.Dockerfile"
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
  if grep -q -E "(($OLD_OWNERS_REGEX)/$OLD_NAME|($OLD_OWNERS_REGEX)|$OLD_NAME|my-app|my_app|my app|My App)" "$file" 2>/dev/null; then
    log_info "Updating: $file"
    
    # Use sed for in-place replacement
    # IMPORTANT: Order matters! Replace full slug first, then owner, then name
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS sed requires '' after -i
      SED_ARGS=(-i '')
      for old_owner in "${OLD_OWNERS[@]}"; do
        SED_ARGS+=(-e "s|$old_owner/$OLD_NAME|$NEW_OWNER/$NEW_NAME|g")
        SED_ARGS+=(-e "s/$old_owner/$NEW_OWNER/g")
      done
      SED_ARGS+=(-e "s|my-app|$NEW_REF_HYPHEN|g")
      SED_ARGS+=(-e "s|my_app|$NEW_REF_UNDERSCORE|g")
      SED_ARGS+=(-e "s|my app|$NEW_REF_SPACE|g")
      SED_ARGS+=(-e "s|My App|$NEW_REF_TITLE|g")
      SED_ARGS+=(-e "s/$OLD_NAME/$NEW_NAME/g")
      sed "${SED_ARGS[@]}" "$file"
    else
      # Linux sed
      SED_ARGS=(-i)
      for old_owner in "${OLD_OWNERS[@]}"; do
        SED_ARGS+=(-e "s|$old_owner/$OLD_NAME|$NEW_OWNER/$NEW_NAME|g")
        SED_ARGS+=(-e "s/$old_owner/$NEW_OWNER/g")
      done
      SED_ARGS+=(-e "s|my-app|$NEW_REF_HYPHEN|g")
      SED_ARGS+=(-e "s|my_app|$NEW_REF_UNDERSCORE|g")
      SED_ARGS+=(-e "s|my app|$NEW_REF_SPACE|g")
      SED_ARGS+=(-e "s|My App|$NEW_REF_TITLE|g")
      SED_ARGS+=(-e "s/$OLD_NAME/$NEW_NAME/g")
      sed "${SED_ARGS[@]}" "$file"
    fi
    
    replaced_count=$((replaced_count + 1))
  fi
done < <(cd "$PROJECT_ROOT" && find . -type f \( "${FIND_ARGS[@]}" \) -print0 2>/dev/null)

if [[ $replaced_count -gt 0 ]]; then
  log_success "Personalized $replaced_count file(s) for $NEW_OWNER/$NEW_NAME"
else
  log_warning "No files found needing personalization"
fi

log_info "Restoring non-local published package scopes in package.json files..."
node "$PROJECT_ROOT/scripts/node/restore-nonlocal-scoped-deps.mjs" --project-root="$PROJECT_ROOT" --new-owner="$NEW_OWNER"
log_success "Restored non-local published package scopes"

log_info "Cleaning up Docker artifacts for removed apps..."
node "$PROJECT_ROOT/scripts/node/cleanup-docker-artifacts.mjs" --project-root="$PROJECT_ROOT"
log_success "Docker artifact cleanup complete"

# Files to rename if they contain the old name
FILE_RENAME_PATTERNS=(
  "packages/scripts/bin/*.mjs"
)

renamed_count=0
for pattern in "${FILE_RENAME_PATTERNS[@]}"; do
  while IFS= read -r -d '' file; do
    if [[ "$file" == *"$OLD_NAME"* ]]; then
      new_file="${file//$OLD_NAME/$NEW_NAME}"
      mv "$file" "$new_file"
      log_info "Renamed: $file -> $new_file"
      renamed_count=$((renamed_count + 1))
    fi
  done < <(cd "$PROJECT_ROOT" && find . -type f -name "$(basename "$pattern")" -print0 2>/dev/null)
done

if [[ $renamed_count -gt 0 ]]; then
  log_success "Renamed $renamed_count file(s) for $NEW_OWNER/$NEW_NAME"
else
  log_warning "No files found needing renaming"
fi

exit 0
