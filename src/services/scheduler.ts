import cronParser from 'cron-parser';

/**
 * Validate a cron expression
 */
export function validateCron(expression: string): boolean {
  try {
    cronParser.parseExpression(expression);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get human-readable description of a cron expression
 */
export function formatCronHuman(expression: string): string {
  try {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) return expression;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Special cases
    if (expression === '* * * * *') return 'every minute';
    if (expression === '0 * * * *') return 'every hour';
    if (expression === '0 0 * * *') return 'daily at midnight';
    if (expression === '0 9 * * *') return 'daily at 9:00 AM';
    if (expression === '0 9 * * 1-5') return 'weekdays at 9:00 AM';

    // Build description
    const desc: string[] = [];

    // Time
    if (minute !== '*' && hour !== '*') {
      const h = parseInt(hour!, 10);
      const m = parseInt(minute!, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      desc.push(`at ${h12}:${m.toString().padStart(2, '0')} ${ampm}`);
    } else if (minute?.startsWith('*/')) {
      desc.push(`every ${minute.slice(2)} minutes`);
    } else if (hour?.startsWith('*/')) {
      desc.push(`every ${hour.slice(2)} hours`);
    }

    // Day of week
    if (dayOfWeek === '1-5') {
      desc.push('on weekdays');
    } else if (dayOfWeek === '0,6') {
      desc.push('on weekends');
    } else if (dayOfWeek !== '*') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayNum = parseInt(dayOfWeek!, 10);
      if (dayNum >= 0 && dayNum <= 6) {
        desc.push(`on ${days[dayNum]}`);
      }
    }

    // Day of month
    if (dayOfMonth !== '*') {
      desc.push(`on day ${dayOfMonth}`);
    }

    return desc.length > 0 ? desc.join(' ') : expression;
  } catch {
    return expression;
  }
}

/**
 * Get the next run time for a cron expression
 */
export function getNextRun(expression: string): string {
  try {
    const interval = cronParser.parseExpression(expression);
    const next = interval.next().toDate();
    
    const now = new Date();
    const diff = next.getTime() - now.getTime();
    
    // Format relative time
    if (diff < 60000) {
      return 'in < 1 min';
    } else if (diff < 3600000) {
      const mins = Math.round(diff / 60000);
      return `in ${mins} min${mins !== 1 ? 's' : ''}`;
    } else if (diff < 86400000) {
      const hours = Math.round(diff / 3600000);
      return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(diff / 86400000);
      return `in ${days} day${days !== 1 ? 's' : ''}`;
    }
  } catch {
    return 'invalid';
  }
}

/**
 * Get the previous run times for a cron expression
 */
export function getPreviousRuns(expression: string, count: number = 5): Date[] {
  try {
    const interval = cronParser.parseExpression(expression, {
      currentDate: new Date(),
    });
    
    const runs: Date[] = [];
    for (let i = 0; i < count; i++) {
      runs.push(interval.prev().toDate());
    }
    return runs;
  } catch {
    return [];
  }
}
