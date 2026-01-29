import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { loadConfig } from './config.js';

const execAsync = promisify(exec);

/**
 * Send a macOS notification using osascript (no dependencies needed)
 */
async function sendMacOSNotification(title: string, message: string, subtitle?: string): Promise<void> {
  // Escape special characters for AppleScript
  const escapeForAppleScript = (str: string) => 
    str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');

  const escapedTitle = escapeForAppleScript(title);
  const escapedMessage = escapeForAppleScript(message);
  const subtitlePart = subtitle ? ` subtitle "${escapeForAppleScript(subtitle)}"` : '';

  const script = `display notification "${escapedMessage}" with title "${escapedTitle}"${subtitlePart}`;
  
  try {
    await execAsync(`osascript -e '${script}'`);
  } catch {
    // Silently fail - notifications are non-critical
    console.log('[notify] Failed to send notification (osascript error)');
  }
}

/**
 * Notify about task start
 */
export async function notifyTaskStart(taskName: string): Promise<void> {
  const config = await loadConfig();
  if (!config.notifications) return;

  await sendMacOSNotification(
    '🚀 Task Started',
    taskName,
    'gemcron'
  );
}

/**
 * Notify about task completion
 */
export async function notifyTaskComplete(taskName: string, durationMs: number): Promise<void> {
  const config = await loadConfig();
  if (!config.notifications) return;

  const durationStr = durationMs < 60000 
    ? `${Math.round(durationMs / 1000)}s`
    : `${Math.round(durationMs / 60000)}m`;

  await sendMacOSNotification(
    '✅ Task Completed',
    `${taskName} (${durationStr})`,
    'gemcron'
  );
}

/**
 * Notify about task failure
 */
export async function notifyTaskFailed(taskName: string, error: string): Promise<void> {
  const config = await loadConfig();
  if (!config.notifications) return;

  // Truncate error message for notification
  const shortError = error.length > 100 ? `${error.slice(0, 100)}...` : error;

  await sendMacOSNotification(
    '❌ Task Failed',
    `${taskName}: ${shortError}`,
    'gemcron'
  );
}
