"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerStartCommand = registerStartCommand;
const chalk_1 = __importDefault(require("chalk"));
const logger_1 = require("../logger");
/**
 * Register the start command
 * @param program Commander program instance
 */
function registerStartCommand(program) {
    program
        .command('start')
        .description('Start logging an Amazon Q Dev CLI session')
        .option('-p, --profile <profile>', 'AWS profile name', 'default')
        .action(async (options) => {
        try {
            const sessionId = await (0, logger_1.startSession)(options.profile);
            console.log(chalk_1.default.green(`✓ Session started with ID: ${sessionId}`));
            console.log(chalk_1.default.blue(`Profile: ${options.profile}`));
            console.log(chalk_1.default.yellow('Amazon Q Dev CLI session is now being logged.'));
            console.log(chalk_1.default.yellow('Run `velo-tracker end` when you finish your session.'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error starting session:'), error);
            process.exit(1);
        }
    });
}
