import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import moment from 'moment';
import { SessionInfo } from '../types';

const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');

/**
 * Summary statistics for a profile
 */
interface ProfileSummary {
  profile: string;
  totalSessions: number;
  totalDuration: number;
  averageDuration: number;
  firstSession: string | null;
  lastSession: string | null;
  activeSessions: number;
}

/**
 * Generate a summary of logs for a specific profile or all profiles
 * @param profile Optional profile name (if not provided, summarizes all profiles)
 * @returns Summary statistics
 */
export async function summarizeLogs(profile?: string): Promise<ProfileSummary[]> {
  const summaries: ProfileSummary[] = [];
  
  // If profile is specified, only summarize that profile
  if (profile) {
    const summary = await summarizeProfileLogs(profile);
    if (summary) {
      summaries.push(summary);
    }
  } else {
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
async function summarizeProfileLogs(profile: string): Promise<ProfileSummary | null> {
  const profileDir = path.join(LOG_DIR, profile);
  
  if (!await fs.pathExists(profileDir)) {
    return null;
  }
  
  // Initialize summary
  const summary: ProfileSummary = {
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
      const sessions: SessionInfo[] = [];
      
      // Read all session files
      for (const file of sessionFiles) {
        const filePath = path.join(archiveDir, file);
        const sessionData = await fs.readJson(filePath) as SessionInfo;
        sessions.push(sessionData);
      }
      
      // Calculate statistics
      let totalDuration = 0;
      let earliestSession = moment();
      let latestSession = moment('1970-01-01');
      
      for (const session of sessions) {
        if (session.duration) {
          totalDuration += session.duration;
        }
        
        const startTime = moment(session.startTime);
        const endTime = session.endTime ? moment(session.endTime) : moment();
        
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
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const remainingMinutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
}
