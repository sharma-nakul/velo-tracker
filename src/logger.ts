import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import * as winston from 'winston';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

// Define the base directory for logs
const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');

// Ensure log directory exists
fs.ensureDirSync(LOG_DIR);

/**
 * Create a logger instance for a specific profile
 * @param profile AWS profile name
 * @returns Winston logger instance
 */
function createLogger(profile: string): winston.Logger {
  const profileDir = path.join(LOG_DIR, profile);
  fs.ensureDirSync(profileDir);

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
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
function getActiveSessionFilePath(profile: string): string {
  const profileDir = path.join(LOG_DIR, profile);
  fs.ensureDirSync(profileDir);
  return path.join(profileDir, 'active-session.json');
}

/**
 * Start a new logging session
 * @param profile AWS profile name
 * @returns Session ID
 */
export async function startSession(profile: string): Promise<string> {
  const sessionId = uuidv4();
  const logger = createLogger(profile);
  const timestamp = moment().format();
  
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
export async function endSession(profile: string, sessionId?: string): Promise<void> {
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
  
  const timestamp = moment().format();
  const duration = moment(timestamp).diff(moment(activeSession.startTime), 'seconds');
  
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
  
  await fs.writeJson(
    path.join(archiveDir, `session-${activeSession.sessionId}.json`), 
    sessionArchive, 
    { spaces: 2 }
  );
  
  // Remove active session file
  await fs.remove(activeSessionPath);
}

/**
 * Get information about all sessions for a profile
 * @param profile AWS profile name
 * @returns Array of session information
 */
export async function listSessions(profile: string): Promise<any[]> {
  const archiveDir = path.join(LOG_DIR, profile, 'archive');
  
  if (!await fs.pathExists(archiveDir)) {
    return [];
  }
  
  const files = await fs.readdir(archiveDir);
  const sessionFiles = files.filter(file => file.startsWith('session-') && file.endsWith('.json'));
  
  const sessions = await Promise.all(
    sessionFiles.map(async (file) => {
      const sessionData = await fs.readJson(path.join(archiveDir, file));
      return sessionData;
    })
  );
  
  // Sort by start time (newest first)
  return sessions.sort((a, b) => 
    moment(b.startTime).valueOf() - moment(a.startTime).valueOf()
  );
}
