#!/usr/bin/env bash
#
# Gemini CLI Notification Hook
# Logs notifications when running scheduled tasks
#
# This hook fires when Gemini CLI needs tool permission or other alerts.

set -e

# Read input from stdin
input=$(cat)

# Only process if running from task manager
if [ -z "$GEMINI_TASK_MANAGER" ]; then
  echo '{"decision": "allow"}'
  exit 0
fi

echo "[GTM Hook] Notification received" >&2

# Extract notification details
notification_type=$(echo "$input" | jq -r '.notification_type // "unknown"')
message=$(echo "$input" | jq -r '.message // ""')

# Log the notification
log_dir="$HOME/.gemini-tasks/logs"
mkdir -p "$log_dir"
log_file="$log_dir/notifications.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] $notification_type: $message" >> "$log_file"

# For ToolPermission notifications, we could auto-approve in the future
# For now, just log and let the default behavior happen

echo '{"decision": "allow"}'
