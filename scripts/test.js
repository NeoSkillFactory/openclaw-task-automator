#!/usr/bin/env node
'use strict';

const { parseIntent, tokenize } = require('./automator');
const { mapCommand, parseCronInterval } = require('./command-mapper');
const { runTask, formatReport } = require('./task-runner');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName}`);
    failed++;
  }
}

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL: ${testName} (expected "${expected}", got "${actual}")`);
    failed++;
  }
}

// --- automator.js tests ---
console.log('\n=== automator.js ===');

console.log('\ntokenize():');
assert(tokenize('Hello World').length === 2, 'tokenizes simple input');
assert(tokenize('  spaced  out  ').length === 2, 'trims and splits whitespace');
assert(tokenize('').length === 0, 'empty input returns empty array');

console.log('\nparseIntent() - file_search:');
let result = parseIntent('Find all .md files in the current directory');
assertEqual(result.intent, 'file_search', 'detects file search intent');
assertEqual(result.params.extension, '.md', 'extracts .md extension');
assert(result.confidence > 0.5, 'confidence is reasonable');

result = parseIntent('find .js files in src/');
assertEqual(result.intent, 'file_search', 'detects find .js');
assertEqual(result.params.extension, '.js', 'extracts .js extension');

console.log('\nparseIntent() - text_search:');
result = parseIntent('search for "TODO" in JavaScript files');
assertEqual(result.intent, 'text_search', 'detects text search intent');
assertEqual(result.params.pattern, 'TODO', 'extracts search pattern');

result = parseIntent("grep for 'error' in log files");
assertEqual(result.intent, 'text_search', 'detects grep intent');
assertEqual(result.params.pattern, 'error', 'extracts error pattern');

console.log('\nparseIntent() - list_files:');
result = parseIntent('list all files in the src directory');
assertEqual(result.intent, 'list_files', 'detects list intent');
assert(result.params.directory.includes('src'), 'extracts src directory');

console.log('\nparseIntent() - create_file:');
result = parseIntent('create a new file named config.json');
assertEqual(result.intent, 'create_file', 'detects create file intent');
assertEqual(result.params.filename, 'config.json', 'extracts filename');

console.log('\nparseIntent() - unknown:');
result = parseIntent('do something completely random and weird');
assertEqual(result.intent, 'unknown', 'returns unknown for unrecognized input');
assertEqual(result.confidence, 0, 'zero confidence for unknown');

console.log('\nparseIntent() - edge cases:');
result = parseIntent('');
assertEqual(result.intent, 'unknown', 'empty string returns unknown');
result = parseIntent(null);
assertEqual(result.intent, 'unknown', 'null returns unknown');
result = parseIntent(undefined);
assertEqual(result.intent, 'unknown', 'undefined returns unknown');

// --- command-mapper.js tests ---
console.log('\n=== command-mapper.js ===');

console.log('\nmapCommand():');
let intent = parseIntent('Find all .md files');
let cmd = mapCommand(intent);
assertEqual(cmd.cmd, 'find', 'maps file_search to find');
assert(cmd.args.includes('-type'), 'includes -type flag');
assert(cmd.description.length > 0, 'has description');

intent = parseIntent('list files in src/');
cmd = mapCommand(intent);
assertEqual(cmd.cmd, 'ls', 'maps list_files to ls');

console.log('\nmapCommand() - null intent:');
cmd = mapCommand(null);
assert(cmd.error !== undefined, 'returns error for null');
assertEqual(cmd.cmd, null, 'null command for null intent');

cmd = mapCommand({ intent: 'nonexistent', params: {} });
assert(cmd.error !== undefined, 'returns error for unsupported intent');

console.log('\nparseCronInterval():');
assertEqual(parseCronInterval('every minute'), '* * * * *', 'minute interval');
assertEqual(parseCronInterval('every hour'), '0 * * * *', 'hour interval');
assertEqual(parseCronInterval('every day'), '0 0 * * *', 'day interval');
assertEqual(parseCronInterval('every week'), '0 0 * * 0', 'week interval');
assertEqual(parseCronInterval('every month'), '0 0 1 * *', 'month interval');

// --- task-runner.js tests ---
console.log('\n=== task-runner.js ===');

console.log('\nrunTask() - shell commands:');
let taskResult = runTask({ cmd: 'echo', args: ['hello'], description: 'echo test' });
assertEqual(taskResult.success, true, 'echo succeeds');
assert(taskResult.stdout.includes('hello'), 'captures stdout');
assertEqual(taskResult.exitCode, 0, 'exit code 0');
assert(taskResult.duration >= 0, 'duration is non-negative');

console.log('\nrunTask() - null command:');
taskResult = runTask(null);
assertEqual(taskResult.success, false, 'null command fails');
assertEqual(taskResult.exitCode, 1, 'exit code 1 for null');

taskResult = runTask({ cmd: null, error: 'test error' });
assertEqual(taskResult.success, false, 'null cmd fails');
assert(taskResult.stderr.includes('test error'), 'captures error message');

console.log('\nrunTask() - internal commands:');
taskResult = runTask({ cmd: 'web_search', args: ['test query'], description: 'web search', isInternal: true });
assertEqual(taskResult.success, true, 'web_search internal succeeds');
assert(taskResult.stdout.includes('test query'), 'web_search captures query');

taskResult = runTask({ cmd: 'cron_create', args: ['* * * * *', 'echo hi'], description: 'cron', isInternal: true });
assertEqual(taskResult.success, true, 'cron_create internal succeeds');

console.log('\nrunTask() - failing command:');
taskResult = runTask({ cmd: 'ls', args: ['/nonexistent_dir_12345'], description: 'list nonexistent' });
assertEqual(taskResult.success, false, 'fails for nonexistent directory');
assert(taskResult.exitCode !== 0, 'non-zero exit code');

console.log('\nformatReport():');
const report = formatReport({
  success: true,
  command: { cmd: 'echo', args: ['test'], description: 'test command' },
  stdout: 'test output',
  stderr: '',
  exitCode: 0,
  duration: 42,
  timestamp: '2026-01-01T00:00:00.000Z',
});
assert(report.includes('SUCCESS'), 'report shows SUCCESS');
assert(report.includes('42ms'), 'report shows duration');
assert(report.includes('test output'), 'report includes output');

// --- Integration test ---
console.log('\n=== Integration ===');

console.log('\nFull pipeline:');
const fullIntent = parseIntent('Find all .js files in scripts/');
const fullCmd = mapCommand(fullIntent);
const fullResult = runTask(fullCmd);
assertEqual(fullResult.success, true, 'full pipeline succeeds');
assert(fullResult.stdout.length > 0, 'finds .js files');
assert(fullResult.stdout.includes('.js'), 'output contains .js files');

// --- Summary ---
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
