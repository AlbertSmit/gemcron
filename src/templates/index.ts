import type { Task } from '../types.js';

/**
 * Pre-configured task templates
 */

export interface TaskTemplate {
  name: string;
  description: string;
  cronExpression: string;
  prompt: string;
}

export const templates: TaskTemplate[] = [
  {
    name: 'Daily Rollbar Check',
    description: 'Check Rollbar for new errors and critical issues',
    cronExpression: '0 9 * * 1-5', // 9 AM on weekdays
    prompt: `Check Rollbar for any new critical or error-level items from the last 24 hours.

Use the Rollbar MCP tools to:
1. Get the top items with get-top-items
2. List any active critical/error items with list-items (filter by level: ["error", "critical"])
3. For each important item, get details with get-item-details

Summarize your findings in a brief report:
- Total new errors in last 24h
- Most critical issues (with item counter/link)
- Any patterns or recurring issues
- Recommended actions

If there are no new issues, just confirm "No new critical issues in Rollbar."`,
  },
  {
    name: 'Weekly Code Review',
    description: 'Analyze recent commits and suggest improvements',
    cronExpression: '0 10 * * 1', // 10 AM on Mondays
    prompt: `Review the git log for the last week and provide a code quality summary.

Run: git log --oneline --since="1 week ago"

Analyze:
1. Number of commits per author
2. Types of changes (features, fixes, refactors)
3. Any concerning patterns (large commits, missing tests, etc.)

Provide a brief summary with any recommendations.`,
  },
  {
    name: 'Daily Standup Prep',
    description: 'Prepare daily standup notes from recent activity',
    cronExpression: '0 8 * * 1-5', // 8 AM on weekdays
    prompt: `Prepare my daily standup notes by analyzing recent git activity.

Run: git log --author="$(git config user.name)" --oneline --since="yesterday"

Format as:
**Yesterday:**
- (list completed items from git log)

**Today:**
- (suggest focus areas based on recent patterns)

**Blockers:**
- (check for any incomplete/WIP commits)`,
  },
];

/**
 * Create a Task from a template
 */
export function createTaskFromTemplate(template: TaskTemplate): Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: template.name,
    description: template.description,
    cronExpression: template.cronExpression,
    prompt: template.prompt,
    enabled: true,
  };
}

/**
 * Get a template by name
 */
export function getTemplate(name: string): TaskTemplate | undefined {
  return templates.find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
}
