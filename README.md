<p align="center">
  <img src="https://img.shields.io/badge/⚡-gemcron-FF8C00?style=for-the-badge&labelColor=1a1a1a" alt="gemcron" />
</p>

<h1 align="center">
  ⚡ gemcron
</h1>

<p align="center">
  <strong>Gemini CLI Cron</strong><br/>
  <sub>Schedule and automate AI-powered tasks from your terminal</sub>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Ink-5.0-1a1a1a?style=flat-square" alt="Ink" />
  <img src="https://img.shields.io/badge/Gemini_CLI-0.26+-E07700?style=flat-square" alt="Gemini CLI" />
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎨 **Beautiful TUI** | Bubbletea-inspired interface with orange theme |
| ⏰ **Natural Language Schedules** | Type "every weekday at 9am" - Gemini converts it |
| 🔄 **Task Sequences** | Run tasks multiple times: `gemcron run "task" --runs=5` |
| 📋 **Templates** | Pre-built tasks for Rollbar, code review, standups |
| 🪝 **Gemini Hooks** | Context injection for smarter AI responses |
| 🗓️ **System Cron** | Reliable scheduling via native crontab |
| 🔒 **Git Sandbox** | Isolate tasks in fresh repo clones (case-sensitive path support) |
| 🔔 **macOS Notifications** | Get notified when tasks start, complete, or fail |

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/AlbertSmit/gemcron.git
cd gemcron
npm install

# Setup (adds 'gemcron' alias)
./setup.sh
source ~/.zshrc

# Launch
gemcron
```

---

## 🎮 Usage

### Interactive Mode

```bash
gemcron
```

| Key | Action |
|-----|--------|
| `↑/k` `↓/j` | Navigate |
| `↵` | View details |
| `n` | New task |
| `e` | Edit |
| `d` | Delete |
| `r` | Run now |
| `q` | Quit |

### Run Tasks

```bash
# Single run
gemcron run "Daily Rollbar Check"

# Multiple runs
gemcron run "Fix Bugs" --runs=5
```

---

## 📦 Built-in Templates

| Template | Description |
|----------|-------------|
| 🐛 **Daily Rollbar Check** | Scan for new errors with MCP tools |
| 📝 **Weekly Code Review** | Analyze commits, suggest improvements |
| 🗣️ **Standup Prep** | Generate notes from git activity |

---

## ⚙️ Configuration

```
~/.gemini-tasks/
├── config.json   # Global settings
├── tasks.json    # Your scheduled tasks
├── logs/         # Execution history
└── sandboxes/    # Git sandbox directories (if used)
```

### config.json

```json
{
  "sandboxBasePath": "/Volumes/Development/.gemcron-sandboxes",
  "useGeminiSandbox": false,
  "notifications": true
}
```

| Option | Description |
|--------|-------------|
| `sandboxBasePath` | Where to clone repos (use case-sensitive volume if needed) |
| `useGeminiSandbox` | Enable Gemini's `-s` security sandbox for all tasks |
| `notifications` | Send macOS notifications for task progress |

### Git Sandbox Mode

When editing a task, enable **Use Sandbox** to:
1. Clone your repo fresh from remote origin
2. Run tasks in an isolated directory
3. Auto-install dependencies (`yarn`/`npm`/`pnpm`)
4. Enforce Gemini's security sandbox (restricts file writes)

### Natural Language → Cron

When creating a task, just describe when you want it to run:

```
"every weekday at 9am"     → 0 9 * * 1-5
"every hour"               → 0 * * * *
"monday at 8:30am"         → 30 8 * * 1
"first day of month"       → 0 0 1 * *
```

---

## 🪝 Gemini CLI Hooks

Hooks inject context when tasks run:

| Hook | Purpose |
|------|---------|
| `SessionStart` | Inject task metadata & previous logs |
| `Notification` | Log tool permission requests |

> Requires Gemini CLI v0.26.0+

---

## 🏗️ Project Structure

```
gemcron/
├── src/
│   ├── cli.tsx           # Entry point
│   ├── App.tsx           # Main UI
│   ├── theme.ts          # Color palette
│   ├── components/       # UI components
│   ├── services/         # Storage, cron, scheduler
│   └── templates/        # Task templates
├── hooks/                # Gemini CLI hooks
└── setup.sh              # Installation
```

---

## 📄 License

MIT © [Albert Smit](https://github.com/AlbertSmit)

---

<p align="center">
  <sub>Built with 🧡 and <a href="https://github.com/vadimdemedes/ink">Ink</a></sub>
</p>
