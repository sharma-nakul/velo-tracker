"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInstallCommand = registerInstallCommand;
const chalk_1 = __importDefault(require("chalk"));
const shell_integration_1 = require("../utils/shell-integration");
/**
 * Register the install command
 * @param program Commander program instance
 */
function registerInstallCommand(program) {
    program
        .command('install')
        .description('Install shell hooks to automatically log Amazon Q sessions')
        .option('-s, --shell <shell>', 'Shell to install hooks for (bash, zsh, or both)', 'both')
        .action(async (options) => {
        try {
            const shells = options.shell === 'both'
                ? ['bash', 'zsh']
                : [options.shell];
            console.log(chalk_1.default.blue('Installing Amazon Q Velo Chat Logger shell hooks...'));
            const results = await (0, shell_integration_1.installShellHooks)(shells);
            for (const [shell, success] of Object.entries(results)) {
                if (success) {
                    console.log(chalk_1.default.green(`✓ Successfully installed hooks for ${shell}`));
                }
                else {
                    console.log(chalk_1.default.yellow(`⚠ Failed to install hooks for ${shell}`));
                }
            }
            console.log(chalk_1.default.yellow('\nIMPORTANT: You need to restart your shell or run:'));
            for (const shell of shells) {
                if (results[shell]) {
                    console.log(chalk_1.default.blue(`source ~/.${shell}rc`));
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error installing shell hooks:'), error);
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
                ? ['bash', 'zsh']
                : [options.shell];
            console.log(chalk_1.default.blue('Uninstalling Amazon Q Velo Chat Logger shell hooks...'));
            const results = await (0, shell_integration_1.uninstallShellHooks)(shells);
            for (const [shell, success] of Object.entries(results)) {
                if (success) {
                    console.log(chalk_1.default.green(`✓ Successfully uninstalled hooks for ${shell}`));
                }
                else {
                    console.log(chalk_1.default.yellow(`⚠ No hooks found for ${shell} or failed to uninstall`));
                }
            }
            console.log(chalk_1.default.yellow('\nIMPORTANT: You need to restart your shell or run:'));
            for (const shell of shells) {
                if (results[shell]) {
                    console.log(chalk_1.default.blue(`source ~/.${shell}rc`));
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Error uninstalling shell hooks:'), error);
            process.exit(1);
        }
    });
}
