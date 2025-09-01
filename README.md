# Nailgun

A modular CLI framework for managing workspace apps built with Bun. Apps can define their own commands that are automatically loaded and integrated into the CLI.

## Installation

```bash
# Install dependencies
bun install

# Or run directly with bun x
bun x nailgun --help
```

## Usage

### Core Commands

#### `create <project-name>`
Initialize a new bun project with workspace apps folder, optionally using a template.

```bash
# Basic usage
bun x nailgun create my-project --branch v0

# Create in current directory
bun x nailgun create --this --branch v0

# Install initial apps during creation
bun x nailgun create my-project --apps @techsakan/frontend,@myorg/backend --branch v0

# Using short format for techsakan repos
bun x nailgun create my-project --apps @/frontend,@/backend --branch v0

# Using shorthand alias
ngun create my-project --apps @vercel/next.js,@nuxt/starter --branch main
```

**Options:**
- `--branch <branch>` - Default branch for apps (required, e.g., v0, v1, v2, main)
- `--this` - Create project in current directory instead of creating a new folder
- `--apps <apps>` - Comma-separated list of initial apps to install (e.g., @techsakan/frontend,@myorg/backend or @/frontend,@/backend)

**Initial Apps Usage:**
When using `--apps <app-list>`, Nailgun will:
1. Create the project structure as usual
2. Install each specified app using the `install-app` command
3. Add all apps to the workspace package.json

This will:
- Create a new directory with the project name (unless using `--this`)
- Initialize a bun project
- Create an `apps/` folder for workspace apps
- Set up package.json with workspace configuration
- Install and configure all specified initial apps

#### `install-app <app>`
Clone a repository from GitHub to the apps folder.

```bash
# Install app with @username/repo format
bun x nailgun install-app @techsakan/frontend
bun x nailgun install-app @vercel/next.js
bun x nailgun install-app @nuxt/starter

# Install app with short format (uses @techsakan as default username)
bun x nailgun install-app @/frontend
bun x nailgun install-app @/backend
```

**Supported formats:**
- `@username/repo` - GitHub username and repository
- `@/repo` - Uses `@techsakan` as default username

This will:
- Clone the repository from `https://github.com/<username>/<repo>.git`
- Place it in the `apps/` folder
- Add the app name to the `apps` array in package.json
- Automatically load any commands defined by the app

#### `uninstall-app <app-name>`
Remove an app from the apps folder and package.json.

```bash
bun x nailgun uninstall-app my-app
```

This will:
- Delete the app folder from `apps/`
- Remove the app from the `apps` array in package.json

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

```javascript
// commands/deploy.ts
export default function(program) {
  program
    .command('deploy')
    .description('Deploy the application')
    .argument('<environment>', 'Deployment environment')
    .action((environment) => {
      console.log(`Deploying to ${environment}...`);
    });
}
```

### TypeScript Support

For TypeScript command files, use `.ts` extension:

```typescript
// commands/test.ts
import { Command } from 'commander';

export default function(program: Command) {
  program
    .command('test')
    .description('Run tests')
    .option('-c, --coverage', 'Generate coverage report')
    .action((options) => {
      console.log('Running tests...');
      if (options.coverage) {
        console.log('Generating coverage report...');
      }
    });
}
```

## Development

```bash
# Run in development mode
bun run dev

# Build the CLI
bun run build

# Run directly
bun run start

# Test help
bun run src/index.ts --help
```

## Example Workflow

```bash
# 1. Create a new project
bun x nailgun create my-workspace

# 2. Navigate to the project
cd my-workspace

# 3. Install apps with custom commands
bun x nailgun install-app @techsakan/frontend
bun x nailgun install-app @myorg/backend

# 4. Check available commands (includes app commands)
bun x nailgun --help

# 5. Use app-specific commands
bun x nailgun build --watch
bun x nailgun deploy production
bun x nailgun test --coverage

# 6. Remove an app if needed
bun x nailgun uninstall-app frontend
```

## Real World Examples

```bash
# Install popular frameworks/templates with their own commands
bun x nailgun install-app @vercel/next.js
bun x nailgun install-app @nuxt/starter
bun x nailgun install-app @svelte/kit

# Install techsakan repos with short format
bun x nailgun install-app @/frontend
bun x nailgun install-app @/backend

# These apps can define commands like:
# bun x nailgun dev        # Start development server
# bun x nailgun build      # Build for production  
# bun x nailgun preview    # Preview production build
```

## Project Structure

```
nailgun/
├── src/
│   ├── index.ts           # Main CLI entry point with dynamic loading
│   ├── utils.ts           # Shared utilities
│   └── commands/
│       ├── create.ts      # Create command
│       ├── install-app.ts # Install app command
│       └── uninstall-app.ts # Uninstall app command
├── package.json
└── README.md

# Example workspace after installing apps:
my-workspace/
├── apps/
│   ├── frontend/
│   │   ├── package.json   # Can define nailgun.commands
│   │   └── commands/
│   │       ├── build.js
│   │       └── dev.js
│   └── backend/
│       ├── package.json   # Can define nailgun.commands
│       └── commands/
│           └── migrate.js
└── package.json
```

## Command Loading Process

1. 🔍 **Scan**: Nailgun scans the `apps/` directory for installed apps
2. 📖 **Read**: Reads each app's `package.json` for `nailgun.commands` array
3. 📥 **Import**: Dynamically imports each command file
4. 🔗 **Register**: Calls the default export function with the Commander program
5. ✅ **Ready**: Commands are available in the CLI

## Features

- **Dynamic Command Loading**: Apps can define their own CLI commands
- **Required @username/repo Format**: Ensures clarity and prevents ambiguity
- **Modular Architecture**: Clean separation of commands and utilities
- **Workspace Management**: Automatically configures bun workspaces
- **GitHub Integration**: Direct cloning from GitHub repositories
- **Package.json Sync**: Keeps track of installed apps
- **Beautiful Logging**: Uses signale for clear, colorful output
- **Built with Bun**: Fast execution and modern JavaScript features
- **Global Usage**: Run anywhere with `bun x nailgun`
- **TypeScript Support**: Full TypeScript support for command definitions
