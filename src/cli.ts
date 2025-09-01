#!/usr/bin/env bun

import { Command } from 'commander';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCommand } from './commands/create.js';
import { logger, readPackageJson } from './utils.js';
import packageJson from '../package.json'

const program = new Command();

// Configure the program
program
  .name('nailgun')
  .description('A modular CLI framework for managing workspace apps')
  .version(packageJson.version);

// Register core commands
createCommand(program);
// Dynamic command loading from apps
async function loadAppCommands() {
  const appsPath = join(process.cwd(), 'apps');

  // Check if apps directory exists
  if (!existsSync(appsPath)) {
    return; // No apps directory, skip dynamic loading
  }

  try {
    const appDirs = readdirSync(appsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const appDir of appDirs) {
      const appPath = join(appsPath, appDir);
      const packageJsonPath = join(appPath, 'package.json');

      // Skip if no package.json exists
      if (!existsSync(packageJsonPath)) {
        continue;
      }

      try {
        const packageJson = await readPackageJson(packageJsonPath);

        // Check for nailgun.commands configuration
        if (packageJson && packageJson.nailgun && packageJson.nailgun.commands) {
          const commands = packageJson.nailgun.commands;

          if (!Array.isArray(commands)) {
            logger.warn(`Invalid nailgun.commands in ${appDir}: must be an array`);
            continue;
          }

          // Load each command
          for (const commandPath of commands) {
            try {
              const fullCommandPath = join(appPath, commandPath);
              const importCommand = (await import(fullCommandPath))?.default;

              // Check if the command file exists
              if (!importCommand) {
                logger.warn(`Command file not found: ${fullCommandPath}`);
                continue;
              }


              program.addCommand(importCommand);
            } catch (error) {
              logger.error(`Failed to load command ${commandPath} from ${appDir}: ${error}`);
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to read package.json for ${appDir}: ${error}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to read apps directory: ${error}`);
  }
}

// Load dynamic commands and then parse arguments
async function main() {
  await loadAppCommands();
  program.parse();
}

// Run the CLI
main().catch((error) => {
  logger.error(`CLI failed: ${error}`);
  process.exit(1);
}); 