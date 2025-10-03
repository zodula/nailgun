import { Command } from 'commander';
import { existsSync } from 'node:fs';
import path, { join, resolve } from 'node:path';
import { logger, runCommand } from '../utils.js';
import { $ } from 'bun';

export function createCommand(program: Command) {
  program
    .command('create')
    .description('Initialize a new bun project with workspace apps folder')
    .argument('<project-name>', 'Name of the project to create')
    .requiredOption('--branch <branch>', 'Default branch for apps (e.g., v0, v1, v2, main)')
    .action(async (projectName: string, options: { branch: string }) => {
      const defaultBranch = options.branch;

      logger.start(`Creating project: ${projectName} with @zodula/zodula (default branch: ${defaultBranch})`);

      const projectPath = resolve(projectName!);

      // Check if directory already exists (only when not using --this)
      if (existsSync(projectPath)) {
        logger.error(`Directory ${projectName} already exists`);
        process.exit(1);
      }

      await Bun.write(join(projectPath, 'package.json'), JSON.stringify({
        name: projectName || 'nailgun-project',
        version: '1.0.0',
        type: 'module',
        "workspaces": [
          "apps/*",
          "apps/*/ui"
        ],
        nailgun: {
          apps: [],
          branch: defaultBranch
        }
      }, null, 2));

      await Bun.write(join(projectPath, 'tsconfig.json'), JSON.stringify({
        "compilerOptions": {
          // Environment setup & latest features
          "lib": [
            "ES2022",
            "DOM",
            "DOM.Iterable"
          ],
          "target": "ESNext",
          "module": "Preserve",
          "moduleDetection": "force",
          "jsx": "preserve",
          "allowJs": true,
          // Bundler mode
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "noEmit": true,
          "baseUrl": ".",
          "paths": {
            "@/*": [
              "./apps/*"
            ]
          },
          // Best practices
          "strict": true,
          "skipLibCheck": true,
          "noFallthroughCasesInSwitch": true,
          "noUncheckedIndexedAccess": true,
          "noImplicitOverride": true,
          // Some stricter flags (disabled by default)
          "noUnusedLocals": false,
          "noUnusedParameters": false,
          "noPropertyAccessFromIndexSignature": false
        },
        "include": [
          ".zodula/**/*.d.ts",
          "apps/**/*"
        ],
        "exclude": [
          "node_modules"
        ]
      }, null, 2));

      await Bun.write(join(projectPath, 'apps', '.keep'), '');

      // Initialize bun project
      const success = await runCommand('bun install', projectPath);
      if (!success) {
        logger.error('Failed to initialize bun project');
        process.exit(1);
      }

      // Install @zodula/zodula as initial app
      logger.info('Installing @zodula/zodula...');
      // TODO: Implement install-app functionality for @zodula/zodula
      await $.cwd(path.resolve(projectPath, "apps"))`git clone https://github.com/zodula/zodula.git -b ${defaultBranch}`

      // run bun install in project path
      const installSuccess = await runCommand('bun install', projectPath);
      if (!installSuccess) {
        logger.error('Failed to install dependencies');
        process.exit(1);
      }

      logger.success(`Project ${projectName} created successfully!`);
      logger.info(`Default branch: ${defaultBranch}`);
      logger.info(`Initial app installed: @zodula/zodula`);
      console.log()
      logger.info(`Next steps:`);
      logger.info(`   cd ${projectName}`);
      logger.info(`   nailgun --help`);
      console.log()
    });
} 