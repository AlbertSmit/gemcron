# Gemini Task Manager

A Terminal UI built with [Ink](https://github.com/vadimdemedes/ink) to manage scheduled tasks that run with Gemini CLI.

## Features

- 📋 Manage scheduled tasks with cron expressions
- 🔄 Integrates with system crontab for reliable execution
- 🎯 Pre-built templates (Rollbar checks, code review, standup prep)
- 🪝 Gemini CLI hooks for context injection

## Quick Start

```bash
# Install dependencies
npm install

# Run setup (adds 'gemcron' alias to ~/.zshrc)
./setup.sh

# Launch the UI
npm run dev
# or after setup:
gemcron
```

## Usage

### Interactive UI

Launch the terminal UI to manage tasks:

```bash
gemcron
```

**Keyboard shortcuts:**
- `j/k` or `↑/↓` - Navigate tasks
- `n` - Create new task
- `e` - Edit selected task
- `d` - Delete selected task
- `Enter` - View task details
- `q` - Quit

### Run a Task Manually

```bash
gemcron run "Daily Rollbar Check"
```

### Task Templates

Built-in templates to get started quickly:

1. **Daily Rollbar Check** - Check for new errors using MCP Rollbar tools
2. **Weekly Code Review** - Analyze git commits and suggest improvements
3. **Daily Standup Prep** - Generate standup notes from git activity

## Configuration

Tasks are stored in `~/.gemini-tasks/tasks.json`

Logs are stored in `~/.gemini-tasks/logs/`

### Gemini CLI Hooks

The project includes hooks that integrate with Gemini CLI:

- **SessionStart** - Injects task context when running scheduled tasks
- **Notification** - Logs tool permission requests

Hooks are configured in `.gemini/settings.json` and require Gemini CLI v0.26.0+.

## Project Structure

```
gemini-task-manager/
├── src/
│   ├── cli.tsx           # CLI entry point
│   ├── App.tsx           # Main React component
│   ├── runner.ts         # Task execution script
│   ├── types.ts          # TypeScript interfaces
│   ├── components/
│   │   ├── TaskList.tsx
│   │   ├── TaskEditor.tsx
│   │   └── TaskDetails.tsx
│   ├── services/
│   │   ├── storage.ts    # JSON persistence
│   │   ├── scheduler.ts  # Cron parsing
│   │   └── cron.ts       # System crontab management
│   └── templates/
│       └── index.ts      # Task templates
├── hooks/
│   ├── session-start.sh
│   └── notification.sh
├── .gemini/
│   └── settings.json     # Hook configuration
└── setup.sh              # Installation script
```

## License

MIT
