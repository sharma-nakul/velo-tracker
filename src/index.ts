#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { 
  startCommand, 
  endCommand, 
  listCommand, 
  installCommand, 
  cleanupCommand, 
  summaryCommand, 
  brewCommand,
  featureCommand,
  serverCommand
} from './commands';
import { logger } from './logger';

// Create base directory if it doesn't exist
const baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
fs.ensureDirSync(baseDir);

const program = new Command();

program
  .name('velo-tracker')
  .description('A command line tool for tracking Amazon Q Dev CLI sessions and feature development')
  .version('1.0.0');

// Add commands
program.addCommand(startCommand);
program.addCommand(endCommand);
program.addCommand(listCommand);
program.addCommand(installCommand);
program.addCommand(cleanupCommand);
program.addCommand(summaryCommand);
program.addCommand(brewCommand);
program.addCommand(featureCommand);
program.addCommand(serverCommand);

// Handle errors
program.exitOverride((err) => {
  if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
    process.exit(0);
  }
  
  logger.error(`Error: ${err.message}`);
  process.exit(1);
});

// Parse arguments
try {
  program.parse(process.argv);
} catch (error) {
  logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
}
