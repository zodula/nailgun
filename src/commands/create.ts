import { Command } from 'commander';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import path, { join, resolve } from 'node:path';
import { logger, readPackageJson, writePackageJson, runCommand } from '../utils.js';
import { $ } from 'bun';

export function createCommand(program: Command) {
  program
    .command('create')
    .description('Initialize a new bun project with workspace apps folder')
    .argument('[project-name]', 'Name of the project to create (required unless --this is used)')
    .option('--this', 'Create project in current directory instead of creating a new folder')
    .requiredOption('--branch <branch>', 'Default branch for apps (e.g., v0, v1, v2, main)')
    .action(async (projectName: string | undefined, options: { this?: boolean; branch: string }) => {
      const useCurrentDir = options.this;
      const defaultBranch = options.branch;
      const initialApps = ['@zodula/zodula'];

      // Validate that either project name is provided or --this flag is used
      if (!projectName && !useCurrentDir) {
        logger.error('Project name is required unless --this flag is used');
        process.exit(1);
      }

      if (projectName && useCurrentDir) {
        logger.error('Cannot specify project name when using --this flag');
        process.exit(1);
      }

      if (useCurrentDir) {
        logger.start(`Creating project in current directory with @zodula/zodula (default branch: ${defaultBranch})`);
      } else {
        logger.start(`Creating project: ${projectName} with @zodula/zodula (default branch: ${defaultBranch})`);
      }

      const projectPath = useCurrentDir ? process.cwd() : resolve(projectName!);

      console.log("projectPath", projectPath);

      // Check if directory already exists (only when not using --this)
      if (!useCurrentDir && existsSync(projectPath)) {
        logger.error(`Directory ${projectName} already exists`);
        process.exit(1);
      }

      // Create project directory (only when not using --this)
      if (!useCurrentDir) {
        mkdirSync(projectPath, { recursive: true });
        logger.info(`Created directory: ${projectName}`);
      }

      // Create apps directory
      const appsPath = join(projectPath, 'apps');
      if (!existsSync(appsPath)) {
        mkdirSync(appsPath, { recursive: true });
        logger.info('Created apps directory');
      } else if (useCurrentDir) {
        logger.info('Apps directory already exists');
      }

      // Initialize bun project
      const success = await runCommand('bun init -y', projectPath);
      if (!success) {
        logger.error('Failed to initialize bun project');
        process.exit(1);
      }

      // Remove default index.ts file
      const indexPath = join(projectPath, 'index.ts');
      if (existsSync(indexPath)) {
        unlinkSync(indexPath);
        logger.info('Removed default index.ts');
      }

      // Update package.json to include workspace configuration
      const packageJsonPath = join(projectPath, 'package.json');
      let packageJson = await readPackageJson(packageJsonPath);

      // If no package.json exists, create a basic one
      if (!packageJson) {
        packageJson = {
          name: projectName || 'nailgun-project',
          version: '1.0.0',
          type: 'module'
        };
      }

      if (packageJson) {
        // Clean up default bun init entries
        delete packageJson.module;
        delete packageJson.scripts;
        delete packageJson.dependencies;
        delete packageJson.devDependencies;
        delete packageJson.peerDependencies;

        // Add workspace and nailgun configuration
        packageJson.workspaces = ['apps/*'];
        packageJson.nailgun = {
          apps: [],
          branch: defaultBranch
        };
        packageJson.type = 'module';
        packageJson.devDependencies = {
          ...packageJson.devDependencies
        };

        await writePackageJson(packageJsonPath, packageJson);
        logger.info('Updated package.json');
      }

      // Install @zodula/zodula as initial app
      logger.info('Installing @zodula/zodula...');
      // TODO: Implement install-app functionality for @zodula/zodula
      const projectShell = $.cwd(path.resolve(projectPath, "apps"))
      await projectShell`git clone https://github.com/zodula/zodula.git`

      // run bun install in project path
      const installSuccess = await runCommand('bun install', projectPath);
      if (!installSuccess) {
        logger.error('Failed to install dependencies');
        process.exit(1);
      }

      if (useCurrentDir) {
        logger.success(`Project created successfully in current directory!`);
        logger.info(`Default branch: ${defaultBranch}`);
        logger.info(`Initial app installed: @zodula/zodula`);
      } else {
        logger.success(`Project ${projectName} created successfully!`);
        logger.info(`Default branch: ${defaultBranch}`);
        logger.info(`Initial app installed: @zodula/zodula`);
        logger.info(`  cd ${projectName}`);
      }
    });
} 