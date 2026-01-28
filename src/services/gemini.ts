import { spawn, type ChildProcess } from 'node:child_process';

/**
 * Use Gemini to convert natural language schedule to cron expression
 */
export async function naturalLanguageToCron(input: string): Promise<string> {
  const prompt = `Convert this schedule description to a cron expression. Output ONLY the cron expression, nothing else. No explanation, no markdown, just the 5-field cron expression.

Schedule: "${input}"

Examples:
- "every day at 9am" → "0 9 * * *"
- "every weekday at noon" → "0 12 * * 1-5"
- "every hour" → "0 * * * *"
- "every 15 minutes" → "*/15 * * * *"
- "every monday at 8:30am" → "30 8 * * 1"
- "first day of month at midnight" → "0 0 1 * *"

Output only the cron expression:`;

  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn('gemini', ['-p', prompt], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        // Extract the cron expression (should be 5 space-separated fields)
        const output = stdout.trim();
        // Try to find a valid cron pattern in the output
        const cronMatch = output.match(/^[\d*\/,-]+\s+[\d*\/,-]+\s+[\d*\/,-]+\s+[\d*\/,-]+\s+[\d*\/,-]+$/m);
        if (cronMatch) {
          resolve(cronMatch[0]);
        } else {
          // If no clean cron found, just return the trimmed output
          // It might work or the cron validator will catch it
          resolve(output.split('\n')[0]?.trim() ?? output);
        }
      } else {
        reject(new Error(stderr || `Gemini exited with code ${code}`));
      }
    });

    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}
