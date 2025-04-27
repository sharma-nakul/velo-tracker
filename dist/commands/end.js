"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEndCommand = registerEndCommand;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const logger_1 = require("../logger");
const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');
/**
 * Register the end command
 * @param program Commander program instance
 */
function registerEndCommand(program) {
    program
        .command('end')
        .description('End logging an Amazon Q Dev CLI session')
        .option('-p, --profile <profile>', 'AWS profile name', 'default')
        .option('-i, --session-id <sessionId>', 'Session ID to end')
        .action(async (options) => {
        try {
            // Check if active session exists
            const profileDir = path.join(LOG_DIR, options.profile);
            const activeSessionPath = path.join(profileDir, 'active-session.json');
            if (!await fs.pathExists(activeSessionPath)) {
                console.log(chalk_1.default.yellow(`No active session found for profile: ${options.profile}`));
                console.log(chalk_1.default.blue('To start a new session, run: velo-tracker start'));
                return;
            }
            // Get active session info for display
            const activeSession = await fs.readJson(activeSessionPath);
            await (0, logger_1.endSession)(options.profile, options.sessionId);
            console.log(chalk_1.default.green('✓ Session ended successfully'));
            console.log(chalk_1.default.blue(`Profile: ${options.profile}`));
            console.log(chalk_1.default.blue(`Session ID: ${activeSession.sessionId}`));
            console.log(chalk_1.default.yellow('Amazon Q Dev CLI session logging has stopped.'));
            console.log(chalk_1.default.yellow('To view session logs, run: velo-tracker list'));
        }
        catch (error) {
            console.error(chalk_1.default.red('Error ending session:'), error);
            process.exit(1);
        }
    });
}
