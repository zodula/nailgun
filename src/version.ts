import { logger } from './utils.js';
import packageJson from '../package.json';

export interface VersionInfo {
  current: string;
  latest: string;
  isOutdated: boolean;
}

/**
 * Fetches the latest version of nailgun from npm registry
 */
export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch('https://registry.npmjs.org/nailgun/latest');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.version;
  } catch (error) {
    logger.warn(`Failed to fetch latest version: ${error}`);
    return null;
  }
}

/**
 * Compares two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parseVersion = (version: string) => {
    return version.split('.').map(num => parseInt(num, 10));
  };

  const v1Parts = parseVersion(v1);
  const v2Parts = parseVersion(v2);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}

/**
 * Checks if the current version is outdated
 */
export async function checkVersion(): Promise<VersionInfo> {
  const currentVersion = packageJson.version;
  const latestVersion = await fetchLatestVersion();

  if (!latestVersion) {
    return {
      current: currentVersion,
      latest: currentVersion,
      isOutdated: false
    };
  }

  const isOutdated = compareVersions(currentVersion, latestVersion) < 0;

  return {
    current: currentVersion,
    latest: latestVersion,
    isOutdated
  };
}

/**
 * Displays version update notification
 */
export function displayVersionNotification(versionInfo: VersionInfo): void {
  if (!versionInfo.isOutdated) {
    return;
  }

  logger.warn(`A newer version of nailgun is available! ${versionInfo.current} -> ${versionInfo.latest}`);
}
