import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import moment from 'moment';

const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');

/**
 * Delete logs older than the specified number of days
 * @param days Number of days to keep logs (default: 30)
 * @param profile Optional profile name to clean up (if not provided, cleans all profiles)
 * @param compact Whether to compact logs instead of just deleting old ones
 * @returns Object containing count of deleted files and remaining files
 */
export async function cleanupOldLogs(
  days: number = 30, 
  profile?: string,
  compact: boolean = false
): Promise<{
  deletedCount: number;
  remainingCount: number;
  compactedCount: number;
}> {
  const cutoffDate = moment().subtract(days, 'days');
  let deletedCount = 0;
  let remainingCount = 0;
  let compactedCount = 0;

  // If profile is specified, only clean that profile
  if (profile) {
    const result = await cleanupProfileLogs(profile, cutoffDate, compact);
    deletedCount = result.deletedCount;
    remainingCount = result.remainingCount;
    compactedCount = result.compactedCount;
  } else {
    // Clean all profiles
    if (await fs.pathExists(LOG_DIR)) {
      const profiles = await fs.readdir(LOG_DIR);
      
      for (const profileName of profiles) {
        const profilePath = path.join(LOG_DIR, profileName);
        const stats = await fs.stat(profilePath);
        
        if (stats.isDirectory()) {
          const result = await cleanupProfileLogs(profileName, cutoffDate, compact);
          
          deletedCount += result.deletedCount;
          remainingCount += result.remainingCount;
          compactedCount += result.compactedCount;
        }
      }
    }
  }

  return { deletedCount, remainingCount, compactedCount };
}

/**
 * Clean up logs for a specific profile
 * @param profile Profile name
 * @param cutoffDate Date threshold for deletion
 * @param compact Whether to compact logs instead of just deleting old ones
 * @returns Updated counters
 */
async function cleanupProfileLogs(
  profile: string, 
  cutoffDate: moment.Moment,
  compact: boolean = false
): Promise<{ 
  deletedCount: number; 
  remainingCount: number;
  compactedCount: number;
}> {
  const profileDir = path.join(LOG_DIR, profile);
  const archiveDir = path.join(profileDir, 'archive');
  let deletedCount = 0;
  let remainingCount = 0;
  let compactedCount = 0;
  
  if (!await fs.pathExists(archiveDir)) {
    return { deletedCount, remainingCount, compactedCount };
  }
  
  const files = await fs.readdir(archiveDir);
  const sessionFiles = files.filter(file => file.startsWith('session-') && file.endsWith('.json'));
  
  if (compact) {
    // Compact mode: Merge old sessions into a single summary file
    const oldSessions = [];
    const recentSessions = [];
    
    for (const file of sessionFiles) {
      const filePath = path.join(archiveDir, file);
      const sessionData = await fs.readJson(filePath);
      
      if (moment(sessionData.endTime).isBefore(cutoffDate)) {
        oldSessions.push(sessionData);
      } else {
        recentSessions.push({ file, data: sessionData });
      }
    }
    
    if (oldSessions.length > 0) {
      // Create a summary file for old sessions
      const summaryFile = path.join(
        archiveDir, 
        `compacted-sessions-${moment().format('YYYY-MM-DD')}.json`
      );
      
      // Calculate summary statistics
      const summary = {
        compactedDate: moment().toISOString(),
        sessionCount: oldSessions.length,
        dateRange: {
          start: oldSessions.reduce((earliest, session) => {
            return !earliest || moment(session.startTime).isBefore(earliest) 
              ? session.startTime 
              : earliest;
          }, null),
          end: oldSessions.reduce((latest, session) => {
            return !latest || moment(session.endTime).isAfter(latest) 
              ? session.endTime 
              : latest;
          }, null)
        },
        totalDuration: oldSessions.reduce((total, session) => total + (session.duration || 0), 0),
        qProfiles: [...new Set(oldSessions.map(s => s.qProfile))],
        sessionIds: oldSessions.map(s => s.id)
      };
      
      // Write the summary file
      await fs.writeJson(summaryFile, summary, { spaces: 2 });
      
      // Delete the old session files
      for (const session of oldSessions) {
        const filePath = path.join(archiveDir, `session-${session.id}.json`);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          deletedCount++;
        }
      }
      
      compactedCount = oldSessions.length;
      remainingCount = recentSessions.length;
    } else {
      remainingCount = sessionFiles.length;
    }
  } else {
    // Standard mode: Just delete old sessions
    for (const file of sessionFiles) {
      const filePath = path.join(archiveDir, file);
      const sessionData = await fs.readJson(filePath);
      
      // Check if the session is older than the cutoff date
      if (moment(sessionData.endTime).isBefore(cutoffDate)) {
        await fs.remove(filePath);
        deletedCount++;
      } else {
        remainingCount++;
      }
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
          return moment(entry.timestamp).isAfter(cutoffDate);
        } catch (e) {
          // If we can't parse the line, keep it
          return true;
        }
      });
      
      // Write back only recent log entries
      await fs.writeFile(logPath, recentLines.join('\n') + '\n');
    }
  }
  
  return { deletedCount, remainingCount, compactedCount };
}
