"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCleanupCommand = registerCleanupCommand;
const chalk_1 = __importDefault(require("chalk"));
const cleanup_1 = require("../utils/cleanup");
/**
 * Register the cleanup command
 * @param program Commander program instance
 */
function registerCleanupCommand(program) {
    program
        .command('cleanup')
        .description('Delete logs older than the specified number of days')
        .option('-p, --profile <profile>', 'AWS profile name')
        .option('-d, --days <days>', 'Number of days to keep logs', '30')
        .action(async (options) => {
        try {
            const days = parseInt(options.days, 10);
            if (isNaN(days) || days <= 0) {
                console.error(chalk_1.default.red('Error: Days must be a positive number'));
                process.exit(1);
            }
            console.log(chalk_1.default.blue(`Cleaning up logs older than ${days} days...`));
            const result = await (0, cleanup_1.cleanupOldLogs)(days, options.profile);
            console.log(chalk_1.default.green(`✓ Cleanup complete`));
            console.log(`Deleted: ${chalk_1.default.yellow(result.deletedCount)} log entries`);
            console.log(`Remaining: ${chalk_1.default.yellow(result.remainingCount)} log entries`);
            if (options.profile) {
                console.log(`Profile: ${chalk_1.default.blue(options.profile)}`);
            }
            else {
                console.log(`All profiles were cleaned`);
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error cleaning up logs:'), error);
            process.exit(1);
        }
    });
}
