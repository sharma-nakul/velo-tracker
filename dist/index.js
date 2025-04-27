#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const commands_1 = require("./commands");
// Read version from package.json
const { version } = require('../package.json');
// Create the program
const program = new commander_1.Command();
// Set up basic program information
program
    .name('velo-tracker')
    .description('A command line tool for tracking Amazon Q Dev CLI sessions and feature development')
    .version(version);
// Register all commands
(0, commands_1.registerCommands)(program);
// Handle unknown commands
program.on('command:*', () => {
    console.error(chalk_1.default.red(`Invalid command: ${program.args.join(' ')}`));
    console.log(`See ${chalk_1.default.blue('--help')} for a list of available commands.`);
    process.exit(1);
});
// Display help if no arguments provided
if (process.argv.length === 2) {
    program.help();
}
// Parse command line arguments
program.parse(process.argv);
