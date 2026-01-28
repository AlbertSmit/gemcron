import { exec } from 'child_process';
import { promisify } from 'util';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Task } from '../types.js';

const execAsync = promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(dirname(__dirname));

// Marker comment to identify our cron jobs
const CRON_MARKER = '# gemini-task-manager';

/**
 * Get all crontab entries
 */
async function getCrontab(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('crontab -l');
    return stdout.trim().split('\n').filter(Boolean);
  } catch {
    // No crontab exists yet
    return [];
  }
}

/**
 * Set the entire crontab
 */
async function setCrontab(lines: string[]): Promise<void> {
  const content = lines.join('\n') + '\n';
  await execAsync(`echo "${content}" | crontab -`);
}

/**
 * Build the cron command for a task
 */
function buildCronCommand(task: Task): string {
  // Run the task runner with the task ID
  const runnerPath = `${PROJECT_ROOT}/src/runner.ts`;
  return `npx tsx "${runnerPath}" "${task.id}"`;
}

/**
 * Build a crontab line for a task
 */
function buildCronLine(task: Task): string {
  const command = buildCronCommand(task);
  return `${task.cronExpression} ${command} ${CRON_MARKER}:${task.id}`;
}

/**
 * Register a task with system cron
 */
export async function registerCronJob(task: Task): Promise<void> {
  const lines = await getCrontab();
  
  // Remove existing entry for this task if any
  const filteredLines = lines.filter(
    (line) => !line.includes(`${CRON_MARKER}:${task.id}`)
  );
  
  // Add new entry
  filteredLines.push(buildCronLine(task));
  
  await setCrontab(filteredLines);
}

/**
 * Unregister a task from system cron
 */
export async function unregisterCronJob(taskId: string): Promise<void> {
  const lines = await getCrontab();
  
  const filteredLines = lines.filter(
    (line) => !line.includes(`${CRON_MARKER}:${taskId}`)
  );
  
  await setCrontab(filteredLines);
}

/**
 * List all gemini-task-manager cron jobs
 */
export async function listCronJobs(): Promise<{ taskId: string; schedule: string }[]> {
  const lines = await getCrontab();
  
  return lines
    .filter((line) => line.includes(CRON_MARKER))
    .map((line) => {
      const match = line.match(new RegExp(`${CRON_MARKER}:([a-f0-9-]+)`));
      const taskId = match?.[1] ?? 'unknown';
      const schedule = line.split(' ').slice(0, 5).join(' ');
      return { taskId, schedule };
    });
}

/**
 * Sync all enabled tasks with crontab
 * (useful for bulk updates)
 */
export async function syncCronJobs(tasks: Task[]): Promise<void> {
  const lines = await getCrontab();
  
  // Remove all gemini-task-manager entries
  const otherLines = lines.filter((line) => !line.includes(CRON_MARKER));
  
  // Add entries for enabled tasks
  const taskLines = tasks
    .filter((task) => task.enabled)
    .map((task) => buildCronLine(task));
  
  await setCrontab([...otherLines, ...taskLines]);
}
