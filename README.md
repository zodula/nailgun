# Nailgun

A modular CLI framework for managing workspace apps built with Bun. Apps can define their own commands that are automatically loaded and integrated into the CLI.

## Installation

```bash
# Install dependencies
bun install --global nailgun@latest
```

## Usage

### Core Commands

#### `create <project-name>`
Initialize a new bun project with workspace apps folder, optionally using a template.

```bash
# Basic usage
nailgun create my-project --branch v0
```

**Options:**
- `--branch <branch>` - Default branch for apps (required, e.g., v0, v1, v2, main)

## Dynamic Command Loading

Nailgun automatically loads commands from installed apps. Apps can define their own CLI commands that integrate seamlessly with the main CLI.

### Defining App Commands

In your app's `package.json`, add a `nailgun.commands` array:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "nailgun": {
    "commands": [
      "commands/build",
      "commands/deploy",
      "commands/test"
    ]
  }
}
```

### Writing Command Functions

Each command file should export a default function that receives the Commander program:

```javascript
// commands/build.ts
import { Command } from "nailgun"
export default function(program) {
  program
    .command('build')
    .description('Build the application')
    .option('-w, --watch', 'Watch for changes')
    .action((options) => {
      console.log('Building application...');
      if (options.watch) {
        console.log('Watching for changes...');
      }
    });
}
```