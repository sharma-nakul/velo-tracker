import chalk from 'chalk';
import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import { createHomebrewFormula } from '../utils/shell-integration';

/**
 * Register the brew command
 * @param program Commander program instance
 */
export function registerBrewCommand(program: Command): void {
  program
    .command('brew')
    .description('Create a Homebrew formula for the package')
    .action(async () => {
      try {
        // Get package info
        const packagePath = path.resolve(__dirname, '..', '..');
        const packageJson = await fs.readJson(path.join(packagePath, 'package.json'));
        const version = packageJson.version;
        
        console.log(chalk.blue('Creating Homebrew formula...'));
        
        const formulaPath = await createHomebrewFormula(packagePath, version);
        
        console.log(chalk.green(`✓ Homebrew formula created at: ${formulaPath}`));
        // Extract username from repository URL
        const repoUrl = packageJson.repository?.url || '';
        const username = repoUrl.match(/github\.com\/([^\/]+)/)?.[1] || 'your-username';
        
        console.log(chalk.yellow('\nTo install with Homebrew:'));
        console.log(chalk.blue(`brew tap ${username}/velo-tracker`));
        console.log(chalk.blue(`brew install velo-tracker`));
        
        console.log(chalk.yellow('\nNote: You need to:'));
        console.log('1. Create a GitHub repository for your tap');
        console.log('2. Push the formula to the repository');
        console.log('3. Update the formula URL to point to your GitHub releases');
      } catch (error) {
        console.error(chalk.red('Error creating Homebrew formula:'), error);
        process.exit(1);
      }
    });
}
