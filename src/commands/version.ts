import { Command } from 'commander';
import { logger } from '../utils.js';
import { checkVersion } from '../version.js';

export function versionCommand(program: Command) {
  program
    .command('version')
    .description('Show version information and check for updates')
    .option('--check', 'Check for updates and show latest version')
    .action(async (options: { check?: boolean }) => {
      if (options.check) {
        logger.start('Checking for updates...');
        const versionInfo = await checkVersion();
        
        logger.info(`Current version: ${versionInfo.current}`);
        logger.info(`Latest version:  ${versionInfo.latest}`);
        
        if (versionInfo.isOutdated) {
          logger.warn('⚠️  A newer version is available!');
          logger.info('Run "nailgun upgrade" to update.');
        } else {
          logger.success('✅ You are using the latest version!');
        }
      } else {
        logger.info(`nailgun version ${program.version()}`);
      }
    });
}
