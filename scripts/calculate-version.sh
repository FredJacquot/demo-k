#!/bin/bash
set -e

# --- Configuration ---
# Override with environment variables if needed
PRE_RELEASE_IDENTIFIER="${PRE_RELEASE_IDENTIFIER:-dev}"

# --- Functions ---
usage() {
  echo "Usage: $0 <base_version_tag>"
  echo "Calculates the next semantic version based on conventional commit messages."
  echo "Run with --help for more details."
  exit 1
}

print_help() {
  echo "USAGE"
  echo "  $0 <base_version_tag>"
  echo ""
  echo "DESCRIPTION"
  echo "  Calculates the next semantic version based on Conventional Commits between the"
  echo "  <base_version_tag> and the current HEAD."
  echo ""
  echo "VERSIONING LOGIC"
  echo "  - MAJOR: 'feat!', 'fix!', etc., or a 'BREAKING CHANGE:' footer."
  echo "  - MINOR: 'feat', 'refactor'."
  echo "  - PATCH: 'fix', 'perf', 'revert', 'build', 'test', 'chore'."
  echo ""
  echo "NON-BUMPING TYPES"
  echo "  'ci', 'docs', 'style' commits do not increment the version."
  echo "  Instead, they trigger a pre-release version."
  echo ""
  echo "PRE-RELEASE LOGIC"
  echo "  When no version increment is triggered by commits:"
  echo "  - If the base is a full release (e.g., v1.2.3), it creates a pre-release"
  echo "    for the *next* patch version (e.g., 1.2.4-dev.1)."
  echo "  - If the base is already a pre-release (e.g., v1.2.3-dev.1), it increments"
  echo "    the pre-release number (e.g., 1.2.3-dev.2)."
  echo ""
  echo "CONFIGURATION"
  echo "  - PRE_RELEASE_IDENTIFIER: Set this environment variable to change the"
  echo "    pre-release identifier. Defaults to 'dev'."
  exit 0
}

# --- Argument Handling ---
STABLE_FLAG=false
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
  print_help
fi
if [ "$2" == "--stable" ]; then
  STABLE_FLAG=true
fi

# --- Input Validation ---
if [ -z "$1" ]; then
  echo "Error: No base version tag provided."
  usage
fi

BASE_TAG="$1"

if ! git rev-parse "$BASE_TAG" >/dev/null 2>&1; then
  echo "Error: Tag '$BASE_TAG' not found in the repository."
  exit 1
fi

# --- Logic ---
# Get commit subjects since the base tag
commit_logs=$(git log "${BASE_TAG}"..HEAD --pretty=%s)

# More reliable commit counting
if [ -z "$commit_logs" ]; then
  commit_count=0
else
  commit_count=$(echo "$commit_logs" | wc -l | tr -d ' ')
fi

# Strip 'v' prefix
base_version_full="${BASE_TAG#v}"

# Separate core version from pre-release string
base_version_core=$(echo "$base_version_full" | cut -d'-' -f1)

# Parse major, minor, patch from the core version
IFS='.' read -r major minor patch <<< "$base_version_core"

# Initialize change flags
is_breaking=0
is_feature=0
is_patch=0

if [ "$commit_count" -gt 0 ]; then
  while IFS= read -r line; do
    # Corrected regex for breaking change to make scope optional
    if echo "$line" | grep -q "BREAKING CHANGE" || echo "$line" | grep -qE "^[a-z]+(\(.*\))?!:"; then
      is_breaking=1
    elif echo "$line" | grep -qE "^(feat|refactor)(\(.*\))?:"; then
      is_feature=1
    elif echo "$line" | grep -qE "^(fix|perf|test|build|revert|chore)(\(.*\))?:"; then
      is_patch=1
    fi
  done <<< "$commit_logs"
fi

# Calculate next version
next_major=$major
next_minor=$minor
next_patch=$patch

if [ "$is_breaking" -eq 1 ]; then
  next_major=$((major + 1))
  next_minor=0
  next_patch=0
elif [ "$is_feature" -eq 1 ]; then
  next_minor=$((minor + 1))
  next_patch=0
elif [ "$is_patch" -eq 1 ]; then
  next_patch=$((patch + 1))
fi

calculated_version="$next_major.$next_minor.$next_patch"
final_version="$calculated_version"

# Handle development pre-releases
if [ "$calculated_version" == "$base_version_core" ]; then
    # Check if the base tag was already a pre-release
    if echo "$base_version_full" | grep -q -- "-${PRE_RELEASE_IDENTIFIER}"; then
        # Base was a pre-release (e.g., v2.2.1-dev.1). Increment the pre-release number.
        latest_prerelease=$(git tag --list "v${base_version_core}-${PRE_RELEASE_IDENTIFIER}.*" | sed "s/^v${base_version_core}-${PRE_RELEASE_IDENTIFIER}\.//" | sort -n | tail -n 1)
        if [ -z "$latest_prerelease" ]; then
          latest_prerelease=0
        fi
        next_prerelease_num=$((latest_prerelease + 1))
        final_version="${base_version_core}-${PRE_RELEASE_IDENTIFIER}.${next_prerelease_num}"
    else
        # Base was a full release (e.g., v2.2.1). Start the dev cycle for the *next* patch.
        next_patch_for_dev=$((patch + 1))
        final_version="${major}.${minor}.${next_patch_for_dev}-${PRE_RELEASE_IDENTIFIER}.1"
    fi
fi

# If stable flag is set, strip any pre-release part
if [ "$STABLE_FLAG" == true ]; then
  final_version=$(echo "$final_version" | cut -d'-' -f1)
fi

# --- Output ---
echo "$final_version"
