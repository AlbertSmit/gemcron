import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Task, TaskLog, TaskStore } from '../types.js';

const CONFIG_DIR = join(homedir(), '.gemini-tasks');
const TASKS_FILE = join(CONFIG_DIR, 'tasks.json');
const LOGS_DIR = join(CONFIG_DIR, 'logs');

async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
  if (!existsSync(LOGS_DIR)) {
    await mkdir(LOGS_DIR, { recursive: true });
  }
}

async function readStore(): Promise<TaskStore> {
  await ensureConfigDir();
  
  if (!existsSync(TASKS_FILE)) {
    return { tasks: [], version: 1 };
  }

  try {
    const content = await readFile(TASKS_FILE, 'utf-8');
    return JSON.parse(content) as TaskStore;
  } catch {
    return { tasks: [], version: 1 };
  }
}

async function writeStore(store: TaskStore): Promise<void> {
  await ensureConfigDir();
  await writeFile(TASKS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export async function loadTasks(): Promise<Task[]> {
  const store = await readStore();
  return store.tasks;
}

export async function getTask(id: string): Promise<Task | undefined> {
  const tasks = await loadTasks();
  return tasks.find((t) => t.id === id);
}

export async function getTaskByName(name: string): Promise<Task | undefined> {
  const tasks = await loadTasks();
  return tasks.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

export async function saveTask(task: Task): Promise<void> {
  const store = await readStore();
  const existingIndex = store.tasks.findIndex((t) => t.id === task.id);

  if (existingIndex >= 0) {
    store.tasks[existingIndex] = task;
  } else {
    store.tasks.push(task);
  }

  await writeStore(store);
}

export async function deleteTask(id: string): Promise<void> {
  const store = await readStore();
  store.tasks = store.tasks.filter((t) => t.id !== id);
  await writeStore(store);
}

export async function updateTaskStatus(
  id: string,
  status: 'success' | 'error' | 'running',
  output?: string
): Promise<void> {
  const store = await readStore();
  const task = store.tasks.find((t) => t.id === id);

  if (task) {
    task.lastRunAt = new Date().toISOString();
    task.lastRunStatus = status;
    if (output) {
      task.lastRunOutput = output;
    }
    await writeStore(store);
  }
}

// Task logs
export async function loadTaskLogs(taskId: string): Promise<TaskLog[]> {
  await ensureConfigDir();
  const logFile = join(LOGS_DIR, `${taskId}.json`);

  if (!existsSync(logFile)) {
    return [];
  }

  try {
    const content = await readFile(logFile, 'utf-8');
    return JSON.parse(content) as TaskLog[];
  } catch {
    return [];
  }
}

export async function appendTaskLog(log: TaskLog): Promise<void> {
  await ensureConfigDir();
  const logFile = join(LOGS_DIR, `${log.taskId}.json`);

  const logs = await loadTaskLogs(log.taskId);
  logs.unshift(log); // Add to beginning (newest first)

  // Keep only last 100 logs
  const trimmedLogs = logs.slice(0, 100);

  await writeFile(logFile, JSON.stringify(trimmedLogs, null, 2), 'utf-8');
}

export { CONFIG_DIR, TASKS_FILE, LOGS_DIR };
