import { Signale } from 'signale';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const logger = new Signale();

// Helper function to read and parse package.json
export async function readPackageJson(path: string) {
  try {
    const file = Bun.file(path);
    const content = await file.text();
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Failed to read package.json: ${error}`);
    return null;
  }
}

// Helper function to write package.json
export async function writePackageJson(path: string, data: any) {
  try {
    await Bun.write(path, JSON.stringify(data, null, 2));
    logger.success(`Updated ${path}`);
  } catch (error) {
    logger.error(`Failed to write package.json: ${error}`);
  }
}

// Helper function to run shell commands
export async function runCommand(command: string, cwd?: string) {
  try {
    const proc = Bun.spawn(command.split(' '), {
      cwd: cwd || process.cwd(),
      stdout: 'inherit',
      stderr: 'inherit'
    });
    const exitCode = await proc.exited;
    return exitCode === 0;
  } catch (error) {
    logger.error(`Command failed: ${command}`);
    return false;
  }
}

// Helper function to ensure apps directory exists
export function ensureAppsDirectory(): string {
  const appsPath = join(process.cwd(), 'apps');
  if (!existsSync(appsPath)) {
    logger.error('Apps directory not found. Run "nailgun create" first.');
    process.exit(1);
  }
  return appsPath;
}

// Helper function to check if app already exists
export function checkAppExists(appName: string, appsPath: string): boolean {
  const appPath = join(appsPath, appName);
  return existsSync(appPath);
}

// Helper function to add app to package.json nailgun.apps array
export async function addAppToPackageJson(appName: string): Promise<void> {
  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJson = await readPackageJson(packageJsonPath);
  
  if (!packageJson) {
    logger.error('package.json not found. Run "nailgun create" first.');
    process.exit(1);
  }

  if (!packageJson.nailgun) {
    packageJson.nailgun = { apps: [] };
  } else if (!packageJson.nailgun.apps) {
    packageJson.nailgun.apps = [];
  }

  if (!packageJson.nailgun.apps.includes(appName)) {
    packageJson.nailgun.apps.push(appName);
    await writePackageJson(packageJsonPath, packageJson);
  }
}

// Helper function to create app directory
export function createAppDirectory(appName: string, appsPath: string): string {
  const appPath = join(appsPath, appName);
  mkdirSync(appPath, { recursive: true });
  return appPath;
}

 