"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSummaryCommand = registerSummaryCommand;
const chalk_1 = __importDefault(require("chalk"));
const summary_1 = require("../utils/summary");
/**
 * Register the summary command
 * @param program Commander program instance
 */
function registerSummaryCommand(program) {
    program
        .command('summary')
        .description('Summarize logs by AWS or Amazon Q profile name')
        .option('-p, --profile <profile>', 'AWS profile name')
        .action(async (options) => {
        try {
            const summaries = await (0, summary_1.summarizeLogs)(options.profile);
            if (summaries.length === 0) {
                console.log(chalk_1.default.yellow('No logs found'));
                return;
            }
            console.log(chalk_1.default.bold('\nAmazon Q Chat Session Summary\n'));
            // Table header
            console.log(chalk_1.default.cyan('Profile'.padEnd(20)) +
                chalk_1.default.cyan('Sessions'.padEnd(10)) +
                chalk_1.default.cyan('Total Time'.padEnd(15)) +
                chalk_1.default.cyan('Avg Time'.padEnd(15)) +
                chalk_1.default.cyan('First Session'.padEnd(25)) +
                chalk_1.default.cyan('Last Session'.padEnd(25)) +
                chalk_1.default.cyan('Active'));
            console.log('-'.repeat(115));
            // Table rows
            for (const summary of summaries) {
                console.log(summary.profile.padEnd(20) +
                    summary.totalSessions.toString().padEnd(10) +
                    (0, summary_1.formatDuration)(summary.totalDuration).padEnd(15) +
                    (0, summary_1.formatDuration)(summary.averageDuration).padEnd(15) +
                    (summary.firstSession
                        ? new Date(summary.firstSession).toLocaleString().padEnd(25)
                        : 'N/A'.padEnd(25)) +
                    (summary.lastSession
                        ? new Date(summary.lastSession).toLocaleString().padEnd(25)
                        : 'N/A'.padEnd(25)) +
                    (summary.activeSessions > 0 ? chalk_1.default.green('Yes') : 'No'));
            }
            console.log('\n');
        }
        catch (error) {
            console.error(chalk_1.default.red('Error generating summary:'), error);
            process.exit(1);
        }
    });
}
