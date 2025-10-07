import { Command } from 'commander';
import { logger, runCommand } from '../utils.js';
import { checkVersion, compareVersions } from '../version.js';

export function upgradeCommand(program: Command) {
  program
    .command('upgrade')
    .description('Upgrade nailgun to the latest version')
    .option('--force', 'Force upgrade even if already on latest version')
    .action(async (options: { force?: boolean }) => {
      logger.start('Checking for updates...');

      const versionInfo = await checkVersion();

      if (!versionInfo.isOutdated && !options.force) {
        logger.success(`Already on the latest version: ${versionInfo.current}`);
        return;
      }

      if (versionInfo.isOutdated) {
        logger.info(`Upgrading from ${versionInfo.current} to ${versionInfo.latest}...`);
      } else {
        logger.info(`Reinstalling version ${versionInfo.current}...`);
      }

      // Check if we're using bun
      const isUsingBun = process.env.npm_config_user_agent?.includes('bun') || 
                        process.argv[0]?.includes('bun');

      if (isUsingBun) {
        logger.info('Upgrading via bun...');
        const success = await runCommand('bun add -g nailgun@latest');
        if (success) {
          logger.success('Successfully upgraded nailgun!');
          logger.info('Please restart your terminal or run "bun --version" to verify.');
        } else {
          logger.error('Failed to upgrade nailgun via bun');
          process.exit(1);
        }
      } else {
        // Try npm first, then fallback to other package managers
        logger.info('Upgrading via npm...');
        const npmSuccess = await runCommand('npm install -g nailgun@latest');
        
        if (npmSuccess) {
          logger.success('Successfully upgraded nailgun!');
          logger.info('Please restart your terminal or run "npm list -g nailgun" to verify.');
        } else {
          // Try yarn as fallback
          logger.info('Trying yarn as fallback...');
          const yarnSuccess = await runCommand('yarn global add nailgun@latest');
          
          if (yarnSuccess) {
            logger.success('Successfully upgraded nailgun!');
            logger.info('Please restart your terminal or run "yarn global list nailgun" to verify.');
          } else {
            logger.error('Failed to upgrade nailgun. Please try manually:');
            logger.info('  npm install -g nailgun@latest');
            logger.info('  or');
            logger.info('  yarn global add nailgun@latest');
            logger.info('  or');
            logger.info('  bun add -g nailgun@latest');
            process.exit(1);
          }
        }
      }

      // Verify the upgrade
      logger.info('Verifying upgrade...');
      const newVersionInfo = await checkVersion();
      
      if (compareVersions(versionInfo.current, newVersionInfo.current) > 0) {
        logger.success(`Successfully upgraded to version ${newVersionInfo.current}!`);
      } else {
        logger.warn('Upgrade completed, but version check shows no change.');
        logger.info('This might be due to caching. Please restart your terminal.');
      }
    });
}
