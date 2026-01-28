import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { saveTask } from '../services/storage.js';
import { registerCronJob, unregisterCronJob } from '../services/cron.js';
import { validateCron, formatCronHuman } from '../services/scheduler.js';
import { naturalLanguageToCron } from '../services/gemini.js';
import { theme } from '../theme.js';
import type { Task } from '../types.js';

interface TaskEditorProps {
  task: Task | null;
  onSave: () => void;
  onCancel: () => void;
}

type Field = 'name' | 'schedule' | 'prompt' | 'confirm';

export function TaskEditor({ task, onSave, onCancel }: TaskEditorProps) {
  const isEditing = task !== null;

  const [name, setName] = useState(task?.name ?? '');
  const [scheduleInput, setScheduleInput] = useState('');
  const [cronExpression, setCronExpression] = useState(
    task?.cronExpression ?? '0 9 * * *'
  );
  const [prompt, setPrompt] = useState(task?.prompt ?? '');
  const [enabled, setEnabled] = useState(task?.enabled ?? true);
  const [activeField, setActiveField] = useState<Field>('name');
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const cronValid = validateCron(cronExpression);
  const canSave = name.length > 0 && cronValid && prompt.length > 0;

  const handleConvertSchedule = async () => {
    if (!scheduleInput.trim()) return;

    // Check if input is already a valid cron expression
    if (validateCron(scheduleInput.trim())) {
      setCronExpression(scheduleInput.trim());
      setScheduleInput('');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const cron = await naturalLanguageToCron(scheduleInput);
      if (validateCron(cron)) {
        setCronExpression(cron);
        setScheduleInput('');
      } else {
        setError(`Gemini returned invalid cron: "${cron}"`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert schedule');
    } finally {
      setIsConverting(false);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (activeField === 'schedule' && key.return && scheduleInput.trim()) {
      handleConvertSchedule();
      return;
    }

    if (key.tab || (key.return && activeField !== 'confirm' && activeField !== 'schedule')) {
      // Move to next field
      const fields: Field[] = ['name', 'schedule', 'prompt', 'confirm'];
      const currentIndex = fields.indexOf(activeField);
      const nextIndex = key.shift
        ? (currentIndex - 1 + fields.length) % fields.length
        : (currentIndex + 1) % fields.length;
      const nextField = fields[nextIndex];
      if (nextField) setActiveField(nextField);
      return;
    }

    if (activeField === 'confirm') {
      if (input === 'e') {
        setEnabled(!enabled);
      }
      if (key.return && canSave) {
        handleSave();
      }
    }
  });

  const handleSave = async () => {
    if (!canSave) {
      setError('Please fill in all required fields');
      return;
    }

    const now = new Date().toISOString();
    const newTask: Task = {
      id: task?.id ?? crypto.randomUUID(),
      name,
      description: '',
      cronExpression,
      prompt,
      enabled,
      createdAt: task?.createdAt ?? now,
      updatedAt: now,
      lastRunAt: task?.lastRunAt,
      lastRunStatus: task?.lastRunStatus,
    };

    try {
      await saveTask(newTask);

      if (enabled) {
        await registerCronJob(newTask);
      } else if (task?.enabled) {
        await unregisterCronJob(newTask.id);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }
  };

  const fieldStyle = (field: Field) => ({
    borderStyle: 'round' as const,
    borderColor: activeField === field ? theme.primary.bright : theme.ui.border,
    paddingX: 1,
    marginBottom: 1,
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color={theme.primary.bright}>
          {isEditing ? `Editing: ${task.name}` : '✨ Create New Task'}
        </Text>
      </Box>

      {/* Name field */}
      <Box flexDirection="column" {...fieldStyle('name')}>
        <Text bold color={theme.text.primary}>Name</Text>
        {activeField === 'name' ? (
          <TextInput value={name} onChange={setName} placeholder="e.g., Daily Rollbar Check" />
        ) : (
          <Text color={name ? theme.text.secondary : theme.text.muted}>{name || '(not set)'}</Text>
        )}
      </Box>

      {/* Schedule field - natural language or cron */}
      <Box flexDirection="column" {...fieldStyle('schedule')}>
        <Box>
          <Text bold color={theme.text.primary}>Schedule </Text>
          {isConverting ? (
            <Text color={theme.primary.bright}>
              <Spinner type="dots" /> Converting with Gemini...
            </Text>
          ) : cronValid ? (
            <Text color={theme.status.success}>✓ {formatCronHuman(cronExpression)}</Text>
          ) : (
            <Text color={theme.status.error}>✗ Invalid schedule</Text>
          )}
        </Box>

        {activeField === 'schedule' ? (
          <Box flexDirection="column">
            <TextInput
              value={scheduleInput}
              onChange={setScheduleInput}
              placeholder="e.g., 'every weekday at 9am' or '0 9 * * 1-5'"
            />
            <Text color={theme.text.dim}>
              Enter natural language or cron syntax, then press Enter
            </Text>
          </Box>
        ) : (
          <Text color={theme.text.muted}>{cronExpression}</Text>
        )}
      </Box>

      {/* Prompt field */}
      <Box flexDirection="column" {...fieldStyle('prompt')}>
        <Text bold color={theme.text.primary}>Prompt</Text>
        {activeField === 'prompt' ? (
          <TextInput
            value={prompt}
            onChange={setPrompt}
            placeholder="Check Rollbar for new errors and summarize findings..."
          />
        ) : (
          <Text color={prompt ? theme.text.secondary : theme.text.muted}>
            {prompt
              ? prompt.length > 60
                ? `${prompt.slice(0, 60)}...`
                : prompt
              : '(not set)'}
          </Text>
        )}
      </Box>

      {/* Confirm section */}
      <Box flexDirection="column" {...fieldStyle('confirm')}>
        <Box>
          <Text bold color={theme.text.primary}>Enabled: </Text>
          <Text color={enabled ? theme.status.active : theme.status.paused}>
            {enabled ? '● Yes' : '○ No'}
          </Text>
          {activeField === 'confirm' && (
            <Text color={theme.text.dim}> (press 'e' to toggle)</Text>
          )}
        </Box>

        {activeField === 'confirm' && (
          <Box marginTop={1}>
            {canSave ? (
              <Text color={theme.status.success}>Press Enter to save</Text>
            ) : (
              <Text color={theme.status.warning}>Fill all fields to save</Text>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color={theme.status.error}>Error: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.key}>tab</Text><Text color={theme.keyText}> next </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> shift+tab</Text><Text color={theme.keyText}> prev </Text>
        <Text color={theme.text.dimmer}>•</Text>
        <Text color={theme.key}> esc</Text><Text color={theme.keyText}> cancel</Text>
      </Box>
    </Box>
  );
}
