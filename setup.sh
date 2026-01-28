#!/usr/bin/env bash
#
# Setup script for Gemini Task Manager
# Adds zsh alias and configures the environment
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALIAS_NAME="gemcron"
ALIAS_COMMAND="npx --prefix \"$SCRIPT_DIR\" tsx \"$SCRIPT_DIR/src/cli.tsx\""

echo "🚀 Gemini Task Manager Setup"
echo ""

# Check for zsh
if [ ! -f "$HOME/.zshrc" ]; then
  echo "⚠️  ~/.zshrc not found. Creating it..."
  touch "$HOME/.zshrc"
fi

# Check if alias already exists
if grep -q "alias $ALIAS_NAME=" "$HOME/.zshrc" 2>/dev/null; then
  echo "✓ Alias '$ALIAS_NAME' already exists in ~/.zshrc"
else
  echo "Adding alias '$ALIAS_NAME' to ~/.zshrc..."
  echo "" >> "$HOME/.zshrc"
  echo "# Gemini Task Manager" >> "$HOME/.zshrc"
  echo "alias $ALIAS_NAME='$ALIAS_COMMAND'" >> "$HOME/.zshrc"
  echo "✓ Alias added"
fi

# Create config directory
CONFIG_DIR="$HOME/.gemini-tasks"
if [ ! -d "$CONFIG_DIR" ]; then
  echo "Creating config directory at $CONFIG_DIR..."
  mkdir -p "$CONFIG_DIR/logs"
  echo '{"tasks":[],"version":1}' > "$CONFIG_DIR/tasks.json"
  echo "✓ Config directory created"
else
  echo "✓ Config directory already exists"
fi

# Install dependencies if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  cd "$SCRIPT_DIR"
  npm install
  echo "✓ Dependencies installed"
else
  echo "✓ Dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Usage:"
echo "  gemcron              - Launch the interactive UI"
echo "  gemcron run <name>   - Run a specific task"
echo ""
echo "To activate the alias in your current shell:"
echo "  source ~/.zshrc"
echo ""
