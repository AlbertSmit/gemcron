import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const CONFIG_DIR = join(homedir(), '.gemini-tasks');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

/**
 * Global configuration for gemcron
 */
export interface GemcronConfig {
  /** Base path for sandbox directories (must be case-sensitive volume if needed) */
  sandboxBasePath: string;
  /** Whether to use Gemini's -s flag for additional security isolation */
  useGeminiSandbox: boolean;
  /** Whether to send macOS notifications for task progress */
  notifications: boolean;
}

const DEFAULT_CONFIG: GemcronConfig = {
  sandboxBasePath: join(CONFIG_DIR, 'sandboxes'),
  useGeminiSandbox: false,
  notifications: true,
};

async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load configuration with defaults
 */
export async function loadConfig(): Promise<GemcronConfig> {
  await ensureConfigDir();

  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = await readFile(CONFIG_FILE, 'utf-8');
    const loaded = JSON.parse(content) as Partial<GemcronConfig>;
    return { ...DEFAULT_CONFIG, ...loaded };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save configuration
 */
export async function saveConfig(config: GemcronConfig): Promise<void> {
  await ensureConfigDir();
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Get the sandbox base path
 */
export async function getSandboxBasePath(): Promise<string> {
  const config = await loadConfig();
  return config.sandboxBasePath;
}

export { CONFIG_DIR, CONFIG_FILE };
