import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { loadTasks, deleteTask } from '../services/storage.js';
import { getNextRun, formatCronHuman } from '../services/scheduler.js';
import { theme } from '../theme.js';
import type { Task } from '../types.js';

interface TaskListProps {
  onSelect: (task: Task) => void;
  onCreate: () => void;
  onEdit: (task: Task) => void;
}

export function TaskList({ onSelect, onCreate, onEdit }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { stdout } = useStdout();

  const terminalHeight = stdout?.rows ?? 24;

  useEffect(() => {
    loadTasks().then((loaded) => {
      setTasks(loaded);
      setLoading(false);
    });
  }, []);

  useInput((input, key) => {
    if (input === 'n') {
      onCreate();
      return;
    }

    if (tasks.length === 0) return;

    // Navigation
    if (input === 'j' || key.downArrow) {
      setSelectedIndex((prev) => Math.min(prev + 1, tasks.length - 1));
      return;
    }
    if (input === 'k' || key.upArrow) {
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    // Actions
    if (key.return) {
      const task = tasks[selectedIndex];
      if (task) onSelect(task);
      return;
    }
    if (input === 'e') {
      const task = tasks[selectedIndex];
      if (task) onEdit(task);
      return;
    }
    if (input === 'd') {
      const taskToDelete = tasks[selectedIndex];
      if (taskToDelete) {
        deleteTask(taskToDelete.id).then(() => {
          setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
          if (selectedIndex >= tasks.length - 1) {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
          }
        });
      }
    }
  });

  if (loading) {
    return (
      <Box>
        <Text color={theme.primary.bright}>
          <Spinner type="dots" />
        </Text>
        <Text color={theme.text.secondary}> Loading tasks...</Text>
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column" flexGrow={1} minHeight={terminalHeight - 4}>
        <Box marginTop={2} flexDirection="column" alignItems="center">
          <Text color={theme.text.muted}>No tasks configured yet</Text>
          <Box marginTop={1}>
            <Text color={theme.text.dim}>Press </Text>
            <Text color={theme.key}>n</Text>
            <Text color={theme.text.dim}> to create your first task</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header with count */}
      <Box marginBottom={1}>
        <Text backgroundColor={theme.ui.badge} color={theme.ui.badgeText} bold>
          {' '}{tasks.length} Task{tasks.length !== 1 ? 's' : ''}{' '}
        </Text>
      </Box>

      {/* Task list */}
      <Box flexDirection="column" flexGrow={1}>
        {tasks.map((task, index) => {
          const isSelected = index === selectedIndex;
          const nextRun = getNextRun(task.cronExpression);

          return (
            <Box key={task.id} marginBottom={1}>
              {/* Selection indicator - colored bar */}
              <Text color={isSelected ? theme.accent : theme.ui.border}>│ </Text>
              
              <Box flexDirection="column">
                {/* Task name */}
                <Text bold color={isSelected ? theme.primary.bright : theme.text.primary}>
                  {task.name}
                </Text>
                
                {/* Task details */}
                <Text color={isSelected ? theme.primary.muted : theme.text.muted}>
                  {formatCronHuman(task.cronExpression)} • {nextRun}
                  {!task.enabled && ' • paused'}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Bottom help */}
      <Box marginTop={1}>
        <Text color={theme.key}>↑/k</Text><Text color={theme.keyText}> up </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> ↓/j</Text><Text color={theme.keyText}> down </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> ↵</Text><Text color={theme.keyText}> view </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> e</Text><Text color={theme.keyText}> edit </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> d</Text><Text color={theme.keyText}> delete </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> n</Text><Text color={theme.keyText}> new </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> q</Text><Text color={theme.keyText}> quit</Text>
      </Box>
    </Box>
  );
}
