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
exports.cleanupOldLogs = cleanupOldLogs;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const moment_1 = __importDefault(require("moment"));
const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');
/**
 * Delete logs older than the specified number of days
 * @param days Number of days to keep logs (default: 30)
 * @param profile Optional profile name to clean up (if not provided, cleans all profiles)
 * @returns Object containing count of deleted files and remaining files
 */
async function cleanupOldLogs(days = 30, profile) {
    const cutoffDate = (0, moment_1.default)().subtract(days, 'days');
    let deletedCount = 0;
    let remainingCount = 0;
    // If profile is specified, only clean that profile
    if (profile) {
        await cleanupProfileLogs(profile, cutoffDate, { deletedCount, remainingCount });
    }
    else {
        // Clean all profiles
        if (await fs.pathExists(LOG_DIR)) {
            const profiles = await fs.readdir(LOG_DIR);
            for (const profileName of profiles) {
                const profilePath = path.join(LOG_DIR, profileName);
                const stats = await fs.stat(profilePath);
                if (stats.isDirectory()) {
                    const result = await cleanupProfileLogs(profileName, cutoffDate, { deletedCount, remainingCount });
                    deletedCount += result.deletedCount;
                    remainingCount += result.remainingCount;
                }
            }
        }
    }
    return { deletedCount, remainingCount };
}
/**
 * Clean up logs for a specific profile
 * @param profile Profile name
 * @param cutoffDate Date threshold for deletion
 * @param counters Object tracking deleted and remaining files
 * @returns Updated counters
 */
async function cleanupProfileLogs(profile, cutoffDate, counters) {
    const profileDir = path.join(LOG_DIR, profile);
    const archiveDir = path.join(profileDir, 'archive');
    if (!await fs.pathExists(archiveDir)) {
        return counters;
    }
    const files = await fs.readdir(archiveDir);
    const sessionFiles = files.filter(file => file.startsWith('session-') && file.endsWith('.json'));
    for (const file of sessionFiles) {
        const filePath = path.join(archiveDir, file);
        const sessionData = await fs.readJson(filePath);
        // Check if the session is older than the cutoff date
        if ((0, moment_1.default)(sessionData.endTime).isBefore(cutoffDate)) {
            await fs.remove(filePath);
            counters.deletedCount++;
        }
        else {
            counters.remainingCount++;
        }
    }
    // Also clean up old log files
    const logFiles = ['combined.log', 'error.log'];
    for (const logFile of logFiles) {
        const logPath = path.join(profileDir, logFile);
        if (await fs.pathExists(logPath)) {
            // For log files, we'll create a rotated version with only recent entries
            const logContent = await fs.readFile(logPath, 'utf8');
            const logLines = logContent.split('\n').filter(line => line.trim());
            const recentLines = logLines.filter(line => {
                try {
                    const entry = JSON.parse(line);
                    return (0, moment_1.default)(entry.timestamp).isAfter(cutoffDate);
                }
                catch (e) {
                    // If we can't parse the line, keep it
                    return true;
                }
            });
            // Write back only recent log entries
            await fs.writeFile(logPath, recentLines.join('\n') + '\n');
        }
    }
    return counters;
}
