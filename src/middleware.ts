import { checkVersion, displayVersionNotification } from './version.js';

/**
 * Version checking middleware that runs before command execution
 * Only checks for updates once per session to avoid spam
 */
let versionChecked = false;

export async function versionCheckMiddleware(): Promise<void> {
  // Skip version check if already checked in this session
  if (versionChecked) {
    return;
  }

  // Skip version check for upgrade command to avoid recursion
  if (process.argv.includes('upgrade')) {
    return;
  }

  try {
    const versionInfo = await checkVersion();
    displayVersionNotification(versionInfo);
    versionChecked = true;
  } catch (error) {
    // Silently fail version check to not interrupt user workflow
    console.error('Version check failed:', error);
  }
}
