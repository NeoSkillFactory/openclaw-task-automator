---
name: openclaw-task-automator
description: Automatically configures and runs OpenClaw tasks from natural language input to reduce manual setup friction.
version: 1.0.0
author: openclaw
triggers:
  - "automate task"
  - "run task from description"
  - "execute openclaw task"
  - "configure and run task"
  - "natural language task execution"
  - "auto run command"
  - "parse and execute task"
  - "task automator"
---

# openclaw-task-automator

## 1. Description

A skill that automatically configures and runs OpenClaw tasks based on natural language input. It parses user requests, maps them to appropriate OpenClaw commands, executes the tasks, and provides structured output with execution summaries.

## 2. Core Capabilities

- Natural language parsing to extract task intent and parameters
- Automatic mapping of intents to OpenClaw commands (file operations, web search, agent spawning, cron jobs, backups)
- Task execution with stdout/stderr capture and exit code validation
- Report generation with execution summaries
- CLI interface for direct use and agent integration

## 3. Configuration

### CLI Flags

- `--input <text>` or `-i <text>`: Natural language task description
- `--dry-run` or `-d`: Show parsed command without executing
- `--verbose` or `-v`: Show detailed execution output
- `--help` or `-h`: Display usage information

### Environment

- Requires Node.js >= 16
- Works in any OpenClaw-compatible environment

## 4. Usage

### Interactive Mode

```bash
node assets/cli.js --input "Find all markdown files in the current directory"
```

### Dry Run Mode

```bash
node assets/cli.js --input "Search for TODO comments in source files" --dry-run
```

### Programmatic Usage

```javascript
const { parseIntent } = require('./scripts/automator');
const { mapCommand } = require('./scripts/command-mapper');
const { runTask } = require('./scripts/task-runner');

const intent = parseIntent("Find all .js files in src/");
const command = mapCommand(intent);
const result = await runTask(command);
```

## 5. Examples

### File Search

```bash
node assets/cli.js -i "Find all JavaScript files in the project"
# Executes: find . -name "*.js" -type f
```

### Text Search

```bash
node assets/cli.js -i "Search for the word 'error' in log files"
# Executes: grep -r "error" --include="*.log" .
```

### Directory Listing

```bash
node assets/cli.js -i "List all files in the src directory"
# Executes: ls -la src/
```
