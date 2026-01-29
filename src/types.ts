export interface Task {
  id: string;
  name: string;
  description: string;
  cronExpression: string;
  prompt: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'error' | 'running';
  lastRunOutput?: string;
  /** Path to local git repo for sandbox mode */
  repoPath?: string;
  /** Branch to checkout in sandbox (default: main) */
  branch?: string;
  /** Enable sandbox mode (clone repo to isolated directory) */
  useSandbox?: boolean;
}

export interface TaskLog {
  taskId: string;
  timestamp: string;
  status: 'success' | 'error';
  output: string;
  duration: number;
}

export interface TaskStore {
  tasks: Task[];
  version: number;
}
