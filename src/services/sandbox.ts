import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { getSandboxBasePath } from './config.js';
import type { Task } from '../types.js';

const execAsync = promisify(exec);

/**
 * Get the sandbox directory path for a task
 */
export async function getSandboxPath(taskId: string): Promise<string> {
  const basePath = await getSandboxBasePath();
  return join(basePath, taskId);
}

/**
 * Get the origin remote URL from a local git repo
 */
async function getOriginUrl(repoPath: string): Promise<string> {
  const { stdout } = await execAsync(`git -C "${repoPath}" remote get-url origin`);
  return stdout.trim();
}

/**
 * Detect which package manager to use based on lockfiles
 */
function detectPackageManager(sandboxPath: string): 'yarn' | 'npm' | 'pnpm' | null {
  if (existsSync(join(sandboxPath, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(sandboxPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(sandboxPath, 'package-lock.json'))) return 'npm';
  if (existsSync(join(sandboxPath, 'package.json'))) return 'npm'; // fallback
  return null;
}

/**
 * Install dependencies in the sandbox
 */
async function installDependencies(sandboxPath: string): Promise<void> {
  const pm = detectPackageManager(sandboxPath);
  if (!pm) {
    console.log('[sandbox] No package.json found, skipping dependency install');
    return;
  }

  // Non-interactive environment
  const env = {
    ...process.env,
    CI: 'true',
    NONINTERACTIVE: '1',
    npm_config_yes: 'true',
  };

  console.log(`[sandbox] Installing dependencies with ${pm}...`);
  const installCmd = pm === 'yarn' ? 'yarn install --frozen-lockfile --non-interactive' 
                   : pm === 'pnpm' ? 'pnpm install --frozen-lockfile'
                   : 'npm ci';
  
  try {
    await execAsync(installCmd, { cwd: sandboxPath, env });
    console.log('[sandbox] Dependencies installed');
  } catch {
    // Fallback to regular install if lockfile commands fail
    console.log('[sandbox] Lockfile install failed, trying regular install...');
    const fallbackCmd = pm === 'yarn' ? 'yarn install --non-interactive' 
                      : pm === 'pnpm' ? 'pnpm install'
                      : 'npm install';
    await execAsync(fallbackCmd, { cwd: sandboxPath, env });
  }
}

/**
 * Prepare sandbox directory for a task
 * - Gets the origin URL from the local repo
 * - Clones fresh from remote (not local copy)
 * - Installs dependencies
 * Returns the sandbox directory path
 */
export async function prepareSandbox(task: Task): Promise<string> {
  if (!task.useSandbox || !task.repoPath) {
    throw new Error('Task is not configured for sandbox mode');
  }

  const sandboxPath = await getSandboxPath(task.id);
  const branch = task.branch || 'main';

  // Get the origin URL from the local repo
  console.log(`[sandbox] Getting origin URL from ${task.repoPath}...`);
  const originUrl = await getOriginUrl(task.repoPath);
  console.log(`[sandbox] Origin: ${originUrl}`);

  // Ensure base directory exists
  const basePath = await getSandboxBasePath();
  if (!existsSync(basePath)) {
    await mkdir(basePath, { recursive: true });
  }

  let needsInstall = false;

  if (!existsSync(sandboxPath)) {
    // First run: fresh clone from remote
    console.log(`[sandbox] Cloning from ${originUrl}...`);
    await execAsync(`git clone --branch "${branch}" "${originUrl}" "${sandboxPath}"`);
    needsInstall = true;
  } else {
    // Subsequent runs: fetch and reset to clean state
    console.log(`[sandbox] Updating sandbox at ${sandboxPath}...`);
    
    try {
      // Fetch latest from origin
      await execAsync(`git -C "${sandboxPath}" fetch origin`);
      
      // Hard reset to origin branch (discards any local state)
      await execAsync(`git -C "${sandboxPath}" checkout "${branch}"`);
      await execAsync(`git -C "${sandboxPath}" reset --hard "origin/${branch}"`);
      
      // Clean untracked files and directories
      await execAsync(`git -C "${sandboxPath}" clean -fdx`);
      needsInstall = true; // clean -x removes node_modules
    } catch {
      // If update fails, nuke and reclone
      console.log('[sandbox] Update failed, performing fresh clone...');
      await rm(sandboxPath, { recursive: true, force: true });
      await execAsync(`git clone --branch "${branch}" "${originUrl}" "${sandboxPath}"`);
      needsInstall = true;
    }
  }

  // Install dependencies
  if (needsInstall) {
    await installDependencies(sandboxPath);
  }

  console.log(`[sandbox] Ready: ${sandboxPath}`);
  return sandboxPath;
}

/**
 * Clean up a task's sandbox directory
 */
export async function cleanupSandbox(taskId: string): Promise<void> {
  const sandboxPath = await getSandboxPath(taskId);
  
  if (existsSync(sandboxPath)) {
    console.log(`[sandbox] Cleaning up ${sandboxPath}...`);
    await rm(sandboxPath, { recursive: true, force: true });
  }
}

/**
 * Check if a sandbox exists for a task
 */
export async function sandboxExists(taskId: string): Promise<boolean> {
  const sandboxPath = await getSandboxPath(taskId);
  return existsSync(sandboxPath);
}
