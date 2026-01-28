import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { runTask } from '../runner.js';
import { getNextRun, formatCronHuman } from '../services/scheduler.js';
import { loadTaskLogs } from '../services/storage.js';
import { theme } from '../theme.js';
import type { Task, TaskLog } from '../types.js';

interface TaskDetailsProps {
  task: Task;
  onEdit: () => void;
  onBack: () => void;
}

export function TaskDetails({ task, onEdit, onBack }: TaskDetailsProps) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);

  useEffect(() => {
    loadTaskLogs(task.id).then(setLogs);
  }, [task.id]);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }
    if (input === 'e') {
      onEdit();
    }
    if (input === 'r' && !isRunning) {
      handleRunNow();
    }
  });

  const handleRunNow = async () => {
    setIsRunning(true);
    setRunOutput(null);
    try {
      const output = await runTask(task.name);
      setRunOutput(output);
    } catch (err) {
      setRunOutput(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const nextRun = getNextRun(task.cronExpression);

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color={theme.primary.bright}>
          📋 {task.name}
        </Text>
        {task.enabled ? (
          <Text color={theme.status.active}> ● Active</Text>
        ) : (
          <Text color={theme.status.paused}> ○ Paused</Text>
        )}
      </Box>

      {/* Details grid */}
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={theme.ui.border}
        paddingX={1}
        marginBottom={1}
      >
        <Box>
          <Box width={12}>
            <Text color={theme.text.muted}>Schedule:</Text>
          </Box>
          <Text color={theme.text.secondary}>
            {task.cronExpression}{' '}
            <Text color={theme.primary.muted}>({formatCronHuman(task.cronExpression)})</Text>
          </Text>
        </Box>

        <Box>
          <Box width={12}>
            <Text color={theme.text.muted}>Next run:</Text>
          </Box>
          <Text color={theme.primary.bright}>{nextRun}</Text>
        </Box>

        {task.lastRunAt && (
          <Box>
            <Box width={12}>
              <Text color={theme.text.muted}>Last run:</Text>
            </Box>
            <Text color={theme.text.secondary}>
              {new Date(task.lastRunAt).toLocaleString()}{' '}
              {task.lastRunStatus === 'success' && <Text color={theme.status.success}>✓</Text>}
              {task.lastRunStatus === 'error' && <Text color={theme.status.error}>✗</Text>}
            </Text>
          </Box>
        )}

        <Box>
          <Box width={12}>
            <Text color={theme.text.muted}>Created:</Text>
          </Box>
          <Text color={theme.text.secondary}>{new Date(task.createdAt).toLocaleDateString()}</Text>
        </Box>
      </Box>

      {/* Prompt */}
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={theme.text.primary}>Prompt:</Text>
        <Box
          borderStyle="round"
          borderColor={theme.ui.border}
          paddingX={1}
          marginTop={0}
        >
          <Text wrap="wrap" color={theme.text.secondary}>{task.prompt}</Text>
        </Box>
      </Box>

      {/* Run output */}
      {(isRunning || runOutput) && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color={theme.text.primary}>
            {isRunning ? (
              <>
                <Text color={theme.primary.bright}>
                  <Spinner type="dots" />
                </Text>{' '}
                Running...
              </>
            ) : (
              'Output:'
            )}
          </Text>
          {runOutput && (
            <Box
              borderStyle="round"
              borderColor={runOutput.startsWith('Error') ? theme.status.error : theme.status.success}
              paddingX={1}
            >
              <Text wrap="wrap" color={theme.text.secondary}>
                {runOutput.length > 500
                  ? `${runOutput.slice(0, 500)}...`
                  : runOutput}
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Recent logs */}
      {logs.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text bold color={theme.text.primary}>Recent Runs:</Text>
          <Box flexDirection="column" borderStyle="round" borderColor={theme.ui.border} paddingX={1}>
            {logs.slice(0, 5).map((log, i) => (
              <Box key={i}>
                <Text color={theme.text.muted}>{new Date(log.timestamp).toLocaleString()}</Text>
                <Text> </Text>
                {log.status === 'success' ? (
                  <Text color={theme.status.success}>✓</Text>
                ) : (
                  <Text color={theme.status.error}>✗</Text>
                )}
                <Text color={theme.text.dim}> {log.duration}ms</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Actions */}
      <Box>
        <Text color={theme.key}>e</Text><Text color={theme.keyText}> edit </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> r</Text><Text color={theme.keyText}> run now </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> esc</Text><Text color={theme.keyText}> back</Text>
      </Box>
    </Box>
  );
}
