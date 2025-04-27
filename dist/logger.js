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
exports.startSession = startSession;
exports.endSession = endSession;
exports.listSessions = listSessions;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const winston = __importStar(require("winston"));
const moment_1 = __importDefault(require("moment"));
const uuid_1 = require("uuid");
// Define the base directory for logs
const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');
// Ensure log directory exists
fs.ensureDirSync(LOG_DIR);
/**
 * Create a logger instance for a specific profile
 * @param profile AWS profile name
 * @returns Winston logger instance
 */
function createLogger(profile) {
    const profileDir = path.join(LOG_DIR, profile);
    fs.ensureDirSync(profileDir);
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        defaultMeta: { profile },
        transports: [
            new winston.transports.File({
                filename: path.join(profileDir, 'error.log'),
                level: 'error'
            }),
            new winston.transports.File({
                filename: path.join(profileDir, 'combined.log')
            }),
        ],
    });
}
/**
 * Get the path to the active session file for a profile
 * @param profile AWS profile name
 * @returns Path to the active session file
 */
function getActiveSessionFilePath(profile) {
    const profileDir = path.join(LOG_DIR, profile);
    fs.ensureDirSync(profileDir);
    return path.join(profileDir, 'active-session.json');
}
/**
 * Start a new logging session
 * @param profile AWS profile name
 * @returns Session ID
 */
async function startSession(profile) {
    const sessionId = (0, uuid_1.v4)();
    const logger = createLogger(profile);
    const timestamp = (0, moment_1.default)().format();
    // Create session info
    const sessionInfo = {
        sessionId,
        profile,
        startTime: timestamp,
        status: 'active'
    };
    // Log session start
    logger.info('Session started', {
        event: 'session_start',
        sessionId,
        timestamp
    });
    // Save active session info
    const activeSessionPath = getActiveSessionFilePath(profile);
    await fs.writeJson(activeSessionPath, sessionInfo, { spaces: 2 });
    return sessionId;
}
/**
 * End an active logging session
 * @param profile AWS profile name
 * @param sessionId Optional session ID (if not provided, will use the active session)
 */
async function endSession(profile, sessionId) {
    const logger = createLogger(profile);
    const activeSessionPath = getActiveSessionFilePath(profile);
    // Check if active session exists
    if (!await fs.pathExists(activeSessionPath)) {
        throw new Error(`No active session found for profile: ${profile}`);
    }
    // Read active session
    const activeSession = await fs.readJson(activeSessionPath);
    // Validate session ID if provided
    if (sessionId && activeSession.sessionId !== sessionId) {
        throw new Error(`Session ID mismatch. Active session: ${activeSession.sessionId}`);
    }
    const timestamp = (0, moment_1.default)().format();
    const duration = (0, moment_1.default)(timestamp).diff((0, moment_1.default)(activeSession.startTime), 'seconds');
    // Log session end
    logger.info('Session ended', {
        event: 'session_end',
        sessionId: activeSession.sessionId,
        timestamp,
        duration,
        startTime: activeSession.startTime
    });
    // Archive session info
    const archiveDir = path.join(LOG_DIR, profile, 'archive');
    fs.ensureDirSync(archiveDir);
    const sessionArchive = {
        ...activeSession,
        endTime: timestamp,
        duration,
        status: 'completed'
    };
    await fs.writeJson(path.join(archiveDir, `session-${activeSession.sessionId}.json`), sessionArchive, { spaces: 2 });
    // Remove active session file
    await fs.remove(activeSessionPath);
}
/**
 * Get information about all sessions for a profile
 * @param profile AWS profile name
 * @returns Array of session information
 */
async function listSessions(profile) {
    const archiveDir = path.join(LOG_DIR, profile, 'archive');
    if (!await fs.pathExists(archiveDir)) {
        return [];
    }
    const files = await fs.readdir(archiveDir);
    const sessionFiles = files.filter(file => file.startsWith('session-') && file.endsWith('.json'));
    const sessions = await Promise.all(sessionFiles.map(async (file) => {
        const sessionData = await fs.readJson(path.join(archiveDir, file));
        return sessionData;
    }));
    // Sort by start time (newest first)
    return sessions.sort((a, b) => (0, moment_1.default)(b.startTime).valueOf() - (0, moment_1.default)(a.startTime).valueOf());
}
