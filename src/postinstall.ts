import chalk from 'chalk';

// This script runs after npm install
console.log(chalk.green('\n✓ Velo Chat Logger installed successfully!\n'));
console.log(chalk.blue('To automatically log Amazon Q sessions, run:'));
console.log('  velo-tracker install\n');
console.log(chalk.blue('To start logging manually:'));
console.log('  velo-tracker start\n');
console.log(chalk.blue('For more information:'));
console.log('  velo-tracker --help\n');
