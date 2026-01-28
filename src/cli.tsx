#!/usr/bin/env node
import { render } from 'ink';
import React from 'react';
import { App } from './App.js';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'run') {
  // Run a specific task by name, optionally multiple times
  // Usage: gemcron run <task-name> [--runs=N]
  const taskName = args[1];

  if (!taskName) {
    console.error('Usage: gemcron run <task-name> [--runs=N]');
    console.error('Example: gemcron run "Fix Rollbar" --runs=5');
    process.exit(1);
  }

  // Parse --runs=N flag
  let repeatCount = 1;
  const runsArg = args.find((arg) => arg.startsWith('--runs='));
  if (runsArg) {
    const value = parseInt(runsArg.split('=')[1] ?? '1', 10);
    if (value > 0) repeatCount = value;
  }

  // Import and run the task runner
  import('./runner.js').then(async ({ runTask }) => {
    for (let i = 0; i < repeatCount; i++) {
      if (repeatCount > 1) {
        console.log(`\n[gemcron] Run ${i + 1}/${repeatCount}`);
      }
      try {
        await runTask(taskName);
      } catch (err) {
        console.error(`[gemcron] Run ${i + 1} failed:`, err);
        if (i < repeatCount - 1) {
          console.log('[gemcron] Continuing to next run...');
        }
      }
    }
  });
} else {
  // Launch the interactive UI
  render(<App />);
}
