import chalk from 'chalk';
import { Command } from 'commander';
import { cleanupOldLogs } from '../utils/cleanup';

/**
 * Register the cleanup command
 * @param program Commander program instance
 */
export function registerCleanupCommand(program: Command): void {
  program
    .command('cleanup')
    .description('Delete logs older than the specified number of days')
    .option('-p, --profile <profile>', 'AWS profile name')
    .option('-d, --days <days>', 'Number of days to keep logs', '30')
    .action(async (options) => {
      try {
        const days = parseInt(options.days, 10);
        
        if (isNaN(days) || days <= 0) {
          console.error(chalk.red('Error: Days must be a positive number'));
          process.exit(1);
        }
        
        console.log(chalk.blue(`Cleaning up logs older than ${days} days...`));
        
        const result = await cleanupOldLogs(days, options.profile);
        
        console.log(chalk.green(`✓ Cleanup complete`));
        console.log(`Deleted: ${chalk.yellow(result.deletedCount)} log entries`);
        console.log(`Remaining: ${chalk.yellow(result.remainingCount)} log entries`);
        
        if (options.profile) {
          console.log(`Profile: ${chalk.blue(options.profile)}`);
        } else {
          console.log(`All profiles were cleaned`);
        }
      } catch (error) {
        console.error(chalk.red('Error cleaning up logs:'), error);
        process.exit(1);
      }
    });
}
