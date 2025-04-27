import chalk from 'chalk';
import { Command } from 'commander';
import { summarizeLogs, formatDuration } from '../utils/summary';

/**
 * Register the summary command
 * @param program Commander program instance
 */
export function registerSummaryCommand(program: Command): void {
  program
    .command('summary')
    .description('Summarize logs by AWS or Amazon Q profile name')
    .option('-p, --profile <profile>', 'AWS profile name')
    .action(async (options) => {
      try {
        const summaries = await summarizeLogs(options.profile);
        
        if (summaries.length === 0) {
          console.log(chalk.yellow('No logs found'));
          return;
        }
        
        console.log(chalk.bold('\nAmazon Q Chat Session Summary\n'));
        
        // Table header
        console.log(
          chalk.cyan('Profile'.padEnd(20)) +
          chalk.cyan('Sessions'.padEnd(10)) +
          chalk.cyan('Total Time'.padEnd(15)) +
          chalk.cyan('Avg Time'.padEnd(15)) +
          chalk.cyan('First Session'.padEnd(25)) +
          chalk.cyan('Last Session'.padEnd(25)) +
          chalk.cyan('Active')
        );
        
        console.log('-'.repeat(115));
        
        // Table rows
        for (const summary of summaries) {
          console.log(
            summary.profile.padEnd(20) +
            summary.totalSessions.toString().padEnd(10) +
            formatDuration(summary.totalDuration).padEnd(15) +
            formatDuration(summary.averageDuration).padEnd(15) +
            (summary.firstSession 
              ? new Date(summary.firstSession).toLocaleString().padEnd(25)
              : 'N/A'.padEnd(25)) +
            (summary.lastSession
              ? new Date(summary.lastSession).toLocaleString().padEnd(25)
              : 'N/A'.padEnd(25)) +
            (summary.activeSessions > 0 ? chalk.green('Yes') : 'No')
          );
        }
        
        console.log('\n');
      } catch (error) {
        console.error(chalk.red('Error generating summary:'), error);
        process.exit(1);
      }
    });
}
