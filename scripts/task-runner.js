'use strict';

/**
 * Task execution engine. Runs mapped commands, captures output,
 * validates exit codes, and generates execution summaries.
 */

const { execFileSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runTask(command, options = {}) {
  const startTime = Date.now();
  const result = {
    command: command,
    success: false,
    stdout: '',
    stderr: '',
    exitCode: 1,
    duration: 0,
    timestamp: new Date().toISOString(),
  };

  if (!command || !command.cmd) {
    result.stderr = command?.error || 'No command to execute';
    result.duration = Date.now() - startTime;
    return result;
  }

  // Handle internal commands that don't map to shell executables
  if (command.isInternal) {
    return runInternalCommand(command, result, startTime, options);
  }

  try {
    const execOptions = {
      encoding: 'utf-8',
      timeout: options.timeout || 30000,
      maxBuffer: 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    };

    if (options.cwd) {
      execOptions.cwd = options.cwd;
    }

    const stdout = execFileSync(command.cmd, command.args || [], execOptions);
    result.stdout = stdout || '';
    result.success = true;
    result.exitCode = 0;
  } catch (err) {
    // execFileSync throws on non-zero exit or other errors
    result.exitCode = err.status || 1;
    result.stdout = err.stdout || '';
    result.stderr = err.stderr || err.message || '';
    // grep returns exit code 1 when no matches found - that's not an error
    if (command.cmd === 'grep' && result.exitCode === 1) {
      result.success = true;
      result.stdout = result.stdout || '(no matches found)';
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

function runInternalCommand(command, result, startTime, options) {
  switch (command.cmd) {
    case 'write_file': {
      const [filename, content] = command.args;
      try {
        const dir = path.dirname(filename);
        if (dir !== '.' && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filename, content || '', 'utf-8');
        result.success = true;
        result.exitCode = 0;
        result.stdout = `File created: ${filename}`;
      } catch (err) {
        result.stderr = `Failed to create file: ${err.message}`;
      }
      break;
    }

    case 'web_search': {
      const [query] = command.args;
      result.success = true;
      result.exitCode = 0;
      result.stdout = `Web search query prepared: "${query}"\nNote: Actual web search requires an agent context with web access.`;
      break;
    }

    case 'cron_create': {
      const [schedule, cmd] = command.args;
      result.success = true;
      result.exitCode = 0;
      result.stdout = `Cron job configured:\nSchedule: ${schedule}\nCommand: ${cmd}\nNote: Actual cron creation requires appropriate system permissions.`;
      break;
    }

    default:
      result.stderr = `Unknown internal command: ${command.cmd}`;
      break;
  }

  result.duration = Date.now() - startTime;
  return result;
}

function formatReport(result) {
  const status = result.success ? 'SUCCESS' : 'FAILED';
  const lines = [
    `--- Task Execution Report ---`,
    `Status: ${status}`,
    `Command: ${result.command?.cmd || 'N/A'} ${(result.command?.args || []).join(' ')}`,
    `Description: ${result.command?.description || 'N/A'}`,
    `Duration: ${result.duration}ms`,
    `Exit Code: ${result.exitCode}`,
    `Timestamp: ${result.timestamp}`,
    `---`,
  ];

  if (result.stdout) {
    lines.push('Output:', result.stdout.trim());
  }
  if (result.stderr && !result.success) {
    lines.push('Errors:', result.stderr.trim());
  }

  return lines.join('\n');
}

module.exports = { runTask, formatReport };
