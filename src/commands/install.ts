import chalk from 'chalk';
import { Command } from 'commander';
import { installShellHooks, uninstallShellHooks } from '../utils/shell-integration';

/**
 * Register the install command
 * @param program Commander program instance
 */
export function registerInstallCommand(program: Command): void {
  program
    .command('install')
    .description('Install shell hooks to automatically log Amazon Q sessions')
    .option('-s, --shell <shell>', 'Shell to install hooks for (bash, zsh, or both)', 'both')
    .action(async (options) => {
      try {
        const shells = options.shell === 'both' 
          ? ['bash', 'zsh'] as ('bash' | 'zsh')[]
          : [options.shell as 'bash' | 'zsh'];
        
        console.log(chalk.blue('Installing Amazon Q Velo Chat Logger shell hooks...'));
        
        const results = await installShellHooks(shells);
        
        for (const [shell, success] of Object.entries(results)) {
          if (success) {
            console.log(chalk.green(`✓ Successfully installed hooks for ${shell}`));
          } else {
            console.log(chalk.yellow(`⚠ Failed to install hooks for ${shell}`));
          }
        }
        
        console.log(chalk.yellow('\nIMPORTANT: You need to restart your shell or run:'));
        for (const shell of shells) {
          if (results[shell]) {
            console.log(chalk.blue(`source ~/.${shell}rc`));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error installing shell hooks:'), error);
        process.exit(1);
      }
    });
    
  program
    .command('uninstall')
    .description('Uninstall shell hooks')
    .option('-s, --shell <shell>', 'Shell to uninstall hooks from (bash, zsh, or both)', 'both')
    .action(async (options) => {
      try {
        const shells = options.shell === 'both' 
          ? ['bash', 'zsh'] as ('bash' | 'zsh')[]
          : [options.shell as 'bash' | 'zsh'];
        
        console.log(chalk.blue('Uninstalling Amazon Q Velo Chat Logger shell hooks...'));
        
        const results = await uninstallShellHooks(shells);
        
        for (const [shell, success] of Object.entries(results)) {
          if (success) {
            console.log(chalk.green(`✓ Successfully uninstalled hooks for ${shell}`));
          } else {
            console.log(chalk.yellow(`⚠ No hooks found for ${shell} or failed to uninstall`));
          }
        }
        
        console.log(chalk.yellow('\nIMPORTANT: You need to restart your shell or run:'));
        for (const shell of shells) {
          if (results[shell]) {
            console.log(chalk.blue(`source ~/.${shell}rc`));
          }
        }
      } catch (error) {
        console.error(chalk.red('Error uninstalling shell hooks:'), error);
        process.exit(1);
      }
    });
}
