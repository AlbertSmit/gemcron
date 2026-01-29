import React, { useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { TaskList } from './components/TaskList.js';
import { TaskEditor } from './components/TaskEditor.js';
import { TaskDetails } from './components/TaskDetails.js';
import { theme } from './theme.js';
import type { Task } from './types.js';

type View = 'list' | 'create' | 'edit' | 'details';

export function App() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [view, setView] = useState<View>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Get terminal dimensions
  const terminalHeight = stdout?.rows ?? 24;

  useInput((input, key) => {
    if (input === 'q' && view === 'list') {
      console.clear();
      exit();
    }
    if (key.escape) {
      if (view !== 'list') {
        setView('list');
        setSelectedTask(null);
      }
    }
  });

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setView('details');
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setView('create');
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setView('edit');
  };

  const handleSaveTask = () => {
    setView('list');
    setSelectedTask(null);
  };

  const handleBack = () => {
    setView('list');
    setSelectedTask(null);
  };

  return (
    <Box
      flexDirection="column"
      padding={1}
      minHeight={terminalHeight}
    >
      <Box flexDirection="column" marginBottom={1}>
        <Box>
          {/* Yellow to orange gradient: ⚡ gemcron */}
          <Text bold color={theme.gradient[0]}>⚡</Text>
          <Text bold color={theme.gradient[1]}> g</Text>
          <Text bold color={theme.gradient[2]}>e</Text>
          <Text bold color={theme.gradient[3]}>m</Text>
          <Text bold color={theme.gradient[4]}>c</Text>
          <Text bold color={theme.gradient[5]}>r</Text>
          <Text bold color={theme.gradient[6]}>o</Text>
          <Text bold color={theme.gradient[7]}>n</Text>
          <Text color={theme.ui.separator}> │ </Text>
          <Text color={theme.text.dim}>gemini cli cron</Text>
        </Box>
      </Box>

      {view === 'list' && (
        <TaskList
          onSelect={handleSelectTask}
          onCreate={handleCreateTask}
          onEdit={handleEditTask}
        />
      )}

      {(view === 'create' || view === 'edit') && (
        <TaskEditor
          task={selectedTask}
          onSave={handleSaveTask}
          onCancel={handleBack}
        />
      )}

      {view === 'details' && selectedTask && (
        <TaskDetails
          task={selectedTask}
          onEdit={() => handleEditTask(selectedTask)}
          onBack={handleBack}
        />
      )}
    </Box>
  );
}
