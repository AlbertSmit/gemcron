#!/usr/bin/env bash
#
# Gemini CLI SessionStart Hook
# Injects context when running from gemini-task-manager
#
# This script reads JSON from stdin and outputs JSON to stdout.
# All debug output goes to stderr.

set -e

# Read input from stdin
input=$(cat)

# Check if we're running from the task manager
if [ -z "$GEMINI_TASK_MANAGER" ]; then
  # Not running from task manager, just allow
  echo '{"decision": "allow"}'
  exit 0
fi

echo "[GTM Hook] SessionStart triggered" >&2

# Get task ID from environment (if set)
task_id="${GEMINI_TASK_ID:-}"

# Build additional context
context=""

if [ -n "$task_id" ]; then
  # Load task info from storage
  tasks_file="$HOME/.gemini-tasks/tasks.json"
  if [ -f "$tasks_file" ]; then
    task_name=$(jq -r ".tasks[] | select(.id == \"$task_id\") | .name" "$tasks_file" 2>/dev/null || echo "")
    if [ -n "$task_name" ]; then
      context="[Running scheduled task: $task_name]"
    fi
  fi
fi

# Add timestamp context
context="$context
[Current time: $(date '+%Y-%m-%d %H:%M:%S %Z')]"

# Output the hook response
if [ -n "$context" ]; then
  # Use jq to properly escape the context for JSON
  jq -n --arg ctx "$context" '{
    "hookSpecificOutput": {
      "additionalContext": $ctx
    },
    "systemMessage": "Running from Gemini Task Manager"
  }'
else
  echo '{"decision": "allow"}'
fi
