#!/usr/bin/env bash
set -euo pipefail

REMOTE="gdrive"
REMOTE_PATH="_tax-planner-data"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/data"

# Check rclone is installed
if ! command -v rclone &>/dev/null; then
  echo "rclone not found. Installing via Homebrew..."
  brew install rclone
fi

# Check rclone has a gdrive remote configured
if ! rclone listremotes | grep -q "^${REMOTE}:$"; then
  echo "No '${REMOTE}' remote configured. Setting up now..."
  echo "Create a remote named '${REMOTE}' with type 'drive' (Google Drive)."
  echo "Leave client_id and client_secret blank. Choose full drive access."
  echo ""
  rclone config
  if ! rclone listremotes | grep -q "^${REMOTE}:$"; then
    echo "Remote '${REMOTE}' still not found. Aborting."
    exit 1
  fi
fi

if [[ "${1:-}" == "-r" ]]; then
  # Restore
  echo "Files on remote:"
  rclone ls "${REMOTE}:${REMOTE_PATH}/" 2>/dev/null || { echo "No files found on remote."; exit 1; }
  echo ""
  read -p "Restore to $LOCAL_DIR? This will overwrite local files. [y/N] " confirm
  if [[ "$confirm" != [yY] ]]; then
    echo "Cancelled."
    exit 0
  fi
  mkdir -p "$LOCAL_DIR"
  echo "Restoring ${REMOTE}:${REMOTE_PATH}/ -> $LOCAL_DIR"
  rclone copy "${REMOTE}:${REMOTE_PATH}/" "$LOCAL_DIR" --progress
else
  # Backup
  if [ ! -d "$LOCAL_DIR" ]; then
    echo "No data directory found at $LOCAL_DIR"
    exit 1
  fi
  echo "Backing up $LOCAL_DIR -> ${REMOTE}:${REMOTE_PATH}/"
  rclone copy "$LOCAL_DIR" "${REMOTE}:${REMOTE_PATH}/" --progress
fi

echo "Done."
