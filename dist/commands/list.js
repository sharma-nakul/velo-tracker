"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerListCommand = registerListCommand;
const chalk_1 = __importDefault(require("chalk"));
const moment_1 = __importDefault(require("moment"));
const logger_1 = require("../logger");
/**
 * Register the list command
 * @param program Commander program instance
 */
function registerListCommand(program) {
    program
        .command('list')
        .description('List all logged Amazon Q Dev CLI sessions')
        .option('-p, --profile <profile>', 'AWS profile name', 'default')
        .option('-l, --limit <limit>', 'Limit the number of sessions to display', '10')
        .action(async (options) => {
        try {
            const sessions = await (0, logger_1.listSessions)(options.profile);
            const limit = parseInt(options.limit, 10);
            if (sessions.length === 0) {
                console.log(chalk_1.default.yellow(`No sessions found for profile: ${options.profile}`));
                return;
            }
            console.log(chalk_1.default.bold(`\nSessions for profile: ${options.profile}\n`));
            // Table header
            console.log(chalk_1.default.cyan('Session ID'.padEnd(38)) +
                chalk_1.default.cyan('Start Time'.padEnd(25)) +
                chalk_1.default.cyan('End Time'.padEnd(25)) +
                chalk_1.default.cyan('Duration'));
            console.log('-'.repeat(100));
            // Table rows
            sessions.slice(0, limit).forEach(session => {
                const duration = session.duration
                    ? formatDuration(session.duration)
                    : 'Active';
                console.log(session.sessionId.padEnd(38) +
                    (0, moment_1.default)(session.startTime).format('YYYY-MM-DD HH:mm:ss').padEnd(25) +
                    (session.endTime
                        ? (0, moment_1.default)(session.endTime).format('YYYY-MM-DD HH:mm:ss').padEnd(25)
                        : 'Active'.padEnd(25)) +
                    duration);
            });
            console.log(`\nShowing ${Math.min(sessions.length, limit)} of ${sessions.length} sessions`);
        }
        catch (error) {
            console.error(chalk_1.default.red('Error listing sessions:'), error);
            process.exit(1);
        }
    });
}
/**
 * Format duration in seconds to a human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    else {
        const hours = Math.floor(seconds / 3600);
        const remainingMinutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    }
}
