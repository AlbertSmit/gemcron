#!/usr/bin/env npx tsx
/**
 * Task Runner - Executes a scheduled task via Gemini CLI
 *
 * Invoked by cron: npx tsx runner.ts <task-id>
 * Or by CLI: gemcron run <task-name>
 */

import { spawn } from 'node:child_process';
import {
  getTask,
  getTaskByName,
  updateTaskStatus,
  appendTaskLog,
} from './services/storage.js';
import type { Task, TaskLog } from './types.js';

/**
 * Run Gemini CLI with the given prompt
 */
async function runGemini(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt];

    // Set environment variable to indicate we're running from task manager
    const env = {
      ...process.env,
      GEMINI_TASK_MANAGER: '1',
    };

    const child = spawn('gemini', args, {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || `Gemini exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Execute a task by ID or name
 */
export async function runTask(idOrName: string): Promise<string> {
  // Try to find task by ID first, then by name
  let task: Task | undefined = await getTask(idOrName);
  if (!task) {
    task = await getTaskByName(idOrName);
  }

  if (!task) {
    throw new Error(`Task not found: ${idOrName}`);
  }

  const startTime = Date.now();

  // Update status to running
  await updateTaskStatus(task.id, 'running');

  try {
    console.log(`[gemcron] Running task: ${task.name}`);
    console.log(`[gemcron] Prompt: ${task.prompt.slice(0, 100)}...`);

    const output = await runGemini(task.prompt);
    const duration = Date.now() - startTime;

    // Update status to success
    await updateTaskStatus(task.id, 'success', output);

    // Log the execution
    const log: TaskLog = {
      taskId: task.id,
      timestamp: new Date().toISOString(),
      status: 'success',
      output: output.slice(0, 10000), // Limit log size
      duration,
    };
    await appendTaskLog(log);

    console.log(`[gemcron] Task completed in ${duration}ms`);
    return output;
  } catch (err) {
    const duration = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // Update status to error
    await updateTaskStatus(task.id, 'error', errorMessage);

    // Log the error
    const log: TaskLog = {
      taskId: task.id,
      timestamp: new Date().toISOString(),
      status: 'error',
      output: errorMessage,
      duration,
    };
    await appendTaskLog(log);

    console.error(`[gemcron] Task failed: ${errorMessage}`);
    throw err;
  }
}

// CLI invocation
const taskIdOrName = process.argv[2];
if (taskIdOrName) {
  runTask(taskIdOrName)
    .then((output) => {
      console.log('\n--- Output ---\n');
      console.log(output);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
