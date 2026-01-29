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
import { prepareSandbox } from './services/sandbox.js';
import { loadConfig } from './services/config.js';
import { notifyTaskStart, notifyTaskComplete, notifyTaskFailed } from './services/notify.js';
import type { Task, TaskLog } from './types.js';

interface RunGeminiOptions {
  cwd?: string;
  useSandboxFlag?: boolean;
}

/**
 * Run Gemini CLI with the given prompt
 */
async function runGemini(prompt: string, options: RunGeminiOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt];
    
    // Add yolo flag for non-interactive execution (auto-approve all tools)
    args.unshift('--yolo');
    
    // Add sandbox flag if configured
    if (options.useSandboxFlag) {
      args.unshift('-s');
    }

    // Set environment variables for non-interactive execution
    const env = {
      ...process.env,
      GEMINI_TASK_MANAGER: '1',
      CI: 'true',           // Suppress interactive prompts in many tools
      NONINTERACTIVE: '1',  // Another common non-interactive flag
    };

    const child = spawn('gemini', args, {
      env,
      cwd: options.cwd,
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
    
    // Send start notification
    await notifyTaskStart(task.name);

    // Prepare sandbox if enabled
    let cwd: string | undefined;
    if (task.useSandbox && task.repoPath) {
      console.log(`[gemcron] Preparing sandbox for ${task.repoPath}...`);
      cwd = await prepareSandbox(task);
      console.log(`[gemcron] Running in sandbox: ${cwd}`);
    }

    // SECURITY: Always use Gemini's -s sandbox flag when running in our git sandbox
    // This restricts writes to only the sandbox directory, making --yolo safe
    // The -s flag is also used for non-sandbox tasks if config.useGeminiSandbox is true
    const config = await loadConfig();
    const useGeminiSandbox = task.useSandbox || config.useGeminiSandbox;
    
    if (task.useSandbox) {
      console.log('[gemcron] Security: Gemini sandbox enabled (writes restricted to sandbox dir)');
    }
    
    const output = await runGemini(task.prompt, {
      cwd,
      useSandboxFlag: useGeminiSandbox,
    });
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
    
    // Send success notification
    await notifyTaskComplete(task.name, duration);
    
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
    
    // Send failure notification
    await notifyTaskFailed(task.name, errorMessage);
    
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
