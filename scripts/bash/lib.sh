#!/usr/bin/env bash
# Common bash utilities and functions for scripts
# Source this file in other scripts: source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

set -euo pipefail

# ============================================================================
# Colors and Formatting
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================================================
# Logging Functions
# ============================================================================

log_error() {
  echo -e "${RED}✗${NC} $*" >&2
}

log_success() {
  echo -e "${GREEN}✓${NC} $*"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $*"
}

log_info() {
  echo -e "${BLUE}ℹ${NC} $*"
}

log_section() {
  echo -e "\n${BOLD}${BLUE}→${NC} ${BOLD}$*${NC}"
}

# ============================================================================
# Path Resolution
# ============================================================================

# Get the directory where the calling script is located
get_script_dir() {
  cd "$(dirname "${BASH_SOURCE[1]}")" && pwd
}

# Get the project root directory (2 levels up from scripts/bash/)
get_project_root() {
  local script_dir
  script_dir=$(get_script_dir)
  cd "$script_dir/../.." && pwd
}

# ============================================================================
# Error Handling
# ============================================================================

fail() {
  log_error "$@"
  exit 1
}

# ============================================================================
# File Operations
# ============================================================================

# Check if file exists
file_exists() {
  [[ -f "$1" ]]
}

# Check if directory exists
dir_exists() {
  [[ -d "$1" ]]
}

# Check if path exists (file or directory)
path_exists() {
  [[ -e "$1" ]]
}

# ============================================================================
# Text Processing
# ============================================================================

# Trim whitespace from string
trim() {
  local var="$*"
  var="${var#"${var%%[![:space:]]*}"}"   # Remove leading whitespace
  var="${var%"${var##*[![:space:]]}"}"   # Remove trailing whitespace
  echo "$var"
}

# Check if string is empty or only whitespace
is_empty() {
  [[ -z "$(trim "$1")" ]]
}

# ============================================================================
# Validation
# ============================================================================

# Require a command to be available
require_command() {
  local cmd="$1"
  if ! command -v "$cmd" &> /dev/null; then
    fail "Required command not found: $cmd"
  fi
}

# Require a file to exist
require_file() {
  local file="$1"
  if ! file_exists "$file"; then
    fail "Required file not found: $file"
  fi
}

# Require a directory to exist
require_dir() {
  local dir="$1"
  if ! dir_exists "$dir"; then
    fail "Required directory not found: $dir"
  fi
}
