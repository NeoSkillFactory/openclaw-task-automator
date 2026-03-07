# OpenClaw Command Reference

## Supported Intents and Their Shell Mappings

### file_search
Finds files by name or extension.

| User Says | Mapped Command |
|-----------|---------------|
| "Find all .md files" | `find . -name "*.md" -type f` |
| "Find .js files in src/" | `find src/ -name "*.js" -type f` |

### text_search
Searches file contents for patterns.

| User Says | Mapped Command |
|-----------|---------------|
| "Search for 'error' in log files" | `grep -r "error" --include "*.log" .` |
| "Grep for TODO in src/" | `grep -r "TODO" src/` |

### list_files
Lists directory contents.

| User Says | Mapped Command |
|-----------|---------------|
| "List files in src/" | `ls -la src/` |
| "Show all files" | `ls -la .` |

### create_file
Creates a new file (internal operation).

| User Says | Action |
|-----------|--------|
| "Create a file named config.json" | Writes empty file `config.json` |

### web_search
Prepares a web search query (requires agent context).

| User Says | Action |
|-----------|--------|
| "Search the web for Node.js docs" | Prepares query for agent web tools |

### backup
Copies files/directories.

| User Says | Mapped Command |
|-----------|---------------|
| "Backup src to ./backup" | `cp -r src ./backup` |

### cron_setup
Schedules recurring tasks (requires system permissions).

| User Says | Cron Schedule |
|-----------|--------------|
| "Run backup every hour" | `0 * * * *` |
| "Run cleanup every day" | `0 0 * * *` |

## Parameter Resolution

Parameters are extracted from natural language using regex pattern matching. When ambiguous, defaults from `task-templates.json` are applied.
