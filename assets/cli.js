#!/usr/bin/env node
'use strict';

/**
 * CLI entry point for openclaw-task-automator.
 * Parses arguments, runs the automation pipeline, and exits with appropriate codes.
 */

const { parseIntent } = require('../scripts/automator');
const { mapCommand } = require('../scripts/command-mapper');
const { runTask, formatReport } = require('../scripts/task-runner');

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { input: null, dryRun: false, verbose: false, help: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
      case '-i':
        opts.input = args[++i];
        break;
      case '--dry-run':
      case '-d':
        opts.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        opts.verbose = true;
        break;
      case '--help':
      case '-h':
        opts.help = true;
        break;
      default:
        // If no flag, treat as input
        if (!opts.input && !args[i].startsWith('-')) {
          opts.input = args[i];
        }
        break;
    }
  }

  return opts;
}

function showHelp() {
  console.log(`openclaw-task-automator - Automate OpenClaw tasks from natural language

Usage:
  node cli.js --input <text> [options]

Options:
  -i, --input <text>   Natural language task description
  -d, --dry-run        Show parsed command without executing
  -v, --verbose        Show detailed execution output
  -h, --help           Display this help message

Examples:
  node cli.js -i "Find all .md files in the current directory"
  node cli.js -i "Search for 'TODO' in JavaScript files" --dry-run
  node cli.js -i "List files in src/" --verbose`);
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    showHelp();
    process.exit(0);
  }

  if (!opts.input) {
    console.error('Error: No input provided. Use --input or -i to specify a task.');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  // Step 1: Parse intent
  if (opts.verbose) {
    console.log(`Parsing input: "${opts.input}"`);
  }

  const intent = parseIntent(opts.input);

  if (opts.verbose) {
    console.log(`Intent: ${intent.intent} (confidence: ${intent.confidence})`);
    console.log(`Params:`, JSON.stringify(intent.params, null, 2));
  }

  if (intent.intent === 'unknown') {
    console.error(`Could not understand the task: "${opts.input}"`);
    console.error('Try rephrasing your request or use --help for examples.');
    process.exit(1);
  }

  // Step 2: Map to command
  const command = mapCommand(intent);

  if (opts.verbose || opts.dryRun) {
    console.log(`Mapped command: ${command.cmd} ${(command.args || []).join(' ')}`);
    console.log(`Description: ${command.description}`);
  }

  if (opts.dryRun) {
    console.log('\n[Dry run] Command would be executed:');
    console.log(`  ${command.cmd} ${(command.args || []).join(' ')}`);
    process.exit(0);
  }

  // Step 3: Execute
  const result = runTask(command);

  // Step 4: Report
  if (opts.verbose) {
    console.log('\n' + formatReport(result));
  } else {
    if (result.success) {
      if (result.stdout) {
        console.log(result.stdout.trim());
      }
      console.log(`\nTask completed successfully (${result.duration}ms)`);
    } else {
      console.error(`Task failed: ${result.stderr || 'Unknown error'}`);
    }
  }

  process.exit(result.exitCode);
}

main();
