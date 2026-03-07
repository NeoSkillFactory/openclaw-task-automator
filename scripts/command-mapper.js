'use strict';

/**
 * Maps parsed intents to executable shell commands.
 */

const path = require('path');

const COMMAND_MAP = {
  file_search: (params) => {
    const dir = params.directory || '.';
    const ext = params.extension || '*';
    if (ext.startsWith('.')) {
      return { cmd: 'find', args: [dir, '-name', `*${ext}`, '-type', 'f'], description: `Find ${ext} files in ${dir}` };
    }
    return { cmd: 'find', args: [dir, '-name', ext, '-type', 'f'], description: `Find files matching "${ext}" in ${dir}` };
  },

  text_search: (params) => {
    const target = params.target || '.';
    const pattern = params.pattern || '';
    const args = ['-r', pattern];

    // If target looks like a file type filter
    if (target.match(/\.\w+\s*files?$/i)) {
      const extMatch = target.match(/\.(\w+)/);
      if (extMatch) {
        args.push('--include', `*.${extMatch[1]}`);
      }
      args.push('.');
    } else {
      args.push(target);
    }

    return { cmd: 'grep', args, description: `Search for "${pattern}" in ${target}` };
  },

  list_files: (params) => {
    const dir = params.directory || '.';
    return { cmd: 'ls', args: ['-la', dir], description: `List files in ${dir}` };
  },

  create_file: (params) => {
    const filename = params.filename || 'untitled.txt';
    const content = params.content || '';
    return {
      cmd: 'write_file',
      args: [filename, content],
      description: `Create file ${filename}`,
      isInternal: true,
    };
  },

  web_search: (params) => {
    const query = params.query || '';
    return {
      cmd: 'web_search',
      args: [query],
      description: `Web search for "${query}"`,
      isInternal: true,
    };
  },

  backup: (params) => {
    const source = params.source || '.';
    const dest = params.destination || './backup';
    return { cmd: 'cp', args: ['-r', source, dest], description: `Backup ${source} to ${dest}` };
  },

  cron_setup: (params) => {
    const interval = parseCronInterval(params.interval || '1 hour');
    const command = params.command || 'echo "no command"';
    return {
      cmd: 'cron_create',
      args: [interval, command],
      description: `Schedule "${command}" ${params.interval}`,
      isInternal: true,
    };
  },
};

function parseCronInterval(interval) {
  const lower = interval.toLowerCase().trim();
  if (lower.includes('minute')) return '* * * * *';
  if (lower.includes('hour')) return '0 * * * *';
  if (lower.includes('day') || lower.includes('daily')) return '0 0 * * *';
  if (lower.includes('week')) return '0 0 * * 0';
  if (lower.includes('month')) return '0 0 1 * *';
  return '0 * * * *'; // default hourly
}

function mapCommand(parsedIntent) {
  if (!parsedIntent || !parsedIntent.intent) {
    return {
      cmd: null,
      args: [],
      description: 'No command mapped - unknown intent',
      isInternal: false,
      error: 'Could not determine intent from input',
    };
  }

  const mapper = COMMAND_MAP[parsedIntent.intent];
  if (!mapper) {
    return {
      cmd: null,
      args: [],
      description: `No command mapping for intent: ${parsedIntent.intent}`,
      isInternal: false,
      error: `Unsupported intent: ${parsedIntent.intent}`,
    };
  }

  const command = mapper(parsedIntent.params);
  return {
    ...command,
    intent: parsedIntent.intent,
    confidence: parsedIntent.confidence,
    raw: parsedIntent.raw,
  };
}

module.exports = { mapCommand, parseCronInterval, COMMAND_MAP };
