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
    .option('-c, --compact', 'Compact old logs instead of deleting them')
    .action(async (options) => {
      try {
        const days = parseInt(options.days, 10);
        const compact = options.compact || false;
        
        if (isNaN(days) || days <= 0) {
          console.error(chalk.red('Error: Days must be a positive number'));
          process.exit(1);
        }
        
        if (compact) {
          console.log(chalk.blue(`Compacting logs older than ${days} days...`));
        } else {
          console.log(chalk.blue(`Cleaning up logs older than ${days} days...`));
        }
        
        const result = await cleanupOldLogs(days, options.profile, compact);
        
        console.log(chalk.green(`✓ Cleanup complete`));
        
        if (compact && result.compactedCount > 0) {
          console.log(`Compacted: ${chalk.yellow(result.compactedCount)} log entries`);
          console.log(`Deleted: ${chalk.yellow(result.deletedCount)} individual log files`);
        } else {
          console.log(`Deleted: ${chalk.yellow(result.deletedCount)} log entries`);
        }
        
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
