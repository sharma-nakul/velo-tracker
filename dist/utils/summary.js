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
exports.summarizeLogs = summarizeLogs;
exports.formatDuration = formatDuration;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const moment_1 = __importDefault(require("moment"));
const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');
/**
 * Generate a summary of logs for a specific profile or all profiles
 * @param profile Optional profile name (if not provided, summarizes all profiles)
 * @returns Summary statistics
 */
async function summarizeLogs(profile) {
    const summaries = [];
    // If profile is specified, only summarize that profile
    if (profile) {
        const summary = await summarizeProfileLogs(profile);
        if (summary) {
            summaries.push(summary);
        }
    }
    else {
        // Summarize all profiles
        if (await fs.pathExists(LOG_DIR)) {
            const profiles = await fs.readdir(LOG_DIR);
            for (const profileName of profiles) {
                const profilePath = path.join(LOG_DIR, profileName);
                const stats = await fs.stat(profilePath);
                if (stats.isDirectory()) {
                    const summary = await summarizeProfileLogs(profileName);
                    if (summary) {
                        summaries.push(summary);
                    }
                }
            }
        }
    }
    return summaries;
}
/**
 * Generate a summary of logs for a specific profile
 * @param profile Profile name
 * @returns Summary statistics or null if profile doesn't exist
 */
async function summarizeProfileLogs(profile) {
    const profileDir = path.join(LOG_DIR, profile);
    if (!await fs.pathExists(profileDir)) {
        return null;
    }
    // Initialize summary
    const summary = {
        profile,
        totalSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
        firstSession: null,
        lastSession: null,
        activeSessions: 0
    };
    // Check for active session
    const activeSessionPath = path.join(profileDir, 'active-session.json');
    if (await fs.pathExists(activeSessionPath)) {
        summary.activeSessions = 1;
    }
    // Process archived sessions
    const archiveDir = path.join(profileDir, 'archive');
    if (await fs.pathExists(archiveDir)) {
        const files = await fs.readdir(archiveDir);
        const sessionFiles = files.filter(file => file.startsWith('session-') && file.endsWith('.json'));
        summary.totalSessions = sessionFiles.length;
        if (sessionFiles.length > 0) {
            const sessions = [];
            // Read all session files
            for (const file of sessionFiles) {
                const filePath = path.join(archiveDir, file);
                const sessionData = await fs.readJson(filePath);
                sessions.push(sessionData);
            }
            // Calculate statistics
            let totalDuration = 0;
            let earliestSession = (0, moment_1.default)();
            let latestSession = (0, moment_1.default)('1970-01-01');
            for (const session of sessions) {
                if (session.duration) {
                    totalDuration += session.duration;
                }
                const startTime = (0, moment_1.default)(session.startTime);
                const endTime = session.endTime ? (0, moment_1.default)(session.endTime) : (0, moment_1.default)();
                if (startTime.isBefore(earliestSession)) {
                    earliestSession = startTime;
                    summary.firstSession = session.startTime;
                }
                if (endTime.isAfter(latestSession)) {
                    latestSession = endTime;
                    summary.lastSession = session.endTime || session.startTime;
                }
            }
            summary.totalDuration = totalDuration;
            summary.averageDuration = sessions.length > 0 ? totalDuration / sessions.length : 0;
        }
    }
    return summary;
}
/**
 * Format duration in seconds to a human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    }
    else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }
    else {
        const hours = Math.floor(seconds / 3600);
        const remainingMinutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    }
}
