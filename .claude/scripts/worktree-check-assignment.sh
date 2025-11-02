#!/bin/bash

# worktree-check-assignment.sh - Check if an issue is assigned to any worktree
# Usage: ./worktree-check-assignment.sh <issue-number>
# Exit codes: 0 = not assigned, 1 = assigned (prints worktree name to stdout)

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ASSIGNMENTS_FILE="$PROJECT_ROOT/.worktree-assignments.json"

# Check arguments
if [ $# -ne 1 ]; then
  echo "Usage: $0 <issue-number>" >&2
  exit 2
fi

ISSUE_NUMBER="$1"

# Validate issue number is numeric
if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "Error: Issue number must be numeric" >&2
  exit 2
fi

# Check if assignments file exists
if [ ! -f "$ASSIGNMENTS_FILE" ]; then
  # No assignments file = no assignments
  exit 0
fi

# Check if issue is assigned to any worktree
ASSIGNED_TO=$(jq -r "to_entries[] | select(.value == $ISSUE_NUMBER) | .key" "$ASSIGNMENTS_FILE")

if [ -n "$ASSIGNED_TO" ]; then
  # Issue is assigned - print worktree name and exit 1
  echo "$ASSIGNED_TO"
  exit 1
else
  # Issue is not assigned - exit 0
  exit 0
fi
