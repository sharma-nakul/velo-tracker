import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { logger } from '../logger';

const LOG_DIR = path.join(os.homedir(), '.velo-tracker', 'logs');

interface SessionData {
  id: string;
  profile: string;
  qProfile: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  autoMode?: boolean;
}

/**
 * Register the end command
 * @param program Commander program instance
 */
export function registerEndCommand(program: Command): void {
  program
    .command('end')
    .description('End the current session')
    .option('-p, --profile <profile>', 'AWS profile name', 'default')
    .option('-s, --session-id <sessionId>', 'Specific session ID to end')
    .option('-a, --auto-mode', 'Ended automatically by shell integration')
    .action(async (options) => {
      try {
        const profile = options.profile;
        const sessionId = options.sessionId;
        const autoMode = options.autoMode || false;
        
        // Determine which session to end
        let activeSessionPath: string;
        let profileDir: string;
        
        if (sessionId) {
          // Find the session by ID across all profiles
          const profiles = await fs.readdir(LOG_DIR);
          let found = false;
          
          for (const profileName of profiles) {
            profileDir = path.join(LOG_DIR, profileName);
            activeSessionPath = path.join(profileDir, 'active-session.json');
            
            if (await fs.pathExists(activeSessionPath)) {
              const session = await fs.readJson(activeSessionPath);
              
              if (session.id === sessionId) {
                found = true;
                break;
              }
            }
          }
          
          if (!found) {
            if (!autoMode) {
              console.error(chalk.red(`No active session found with ID: ${sessionId}`));
              process.exit(1);
            } else {
              logger.error(`Auto mode: No active session found with ID: ${sessionId}`);
              return;
            }
          }
        } else {
          // Use the specified profile
          profileDir = path.join(LOG_DIR, profile);
          activeSessionPath = path.join(profileDir, 'active-session.json');
          
          if (!await fs.pathExists(activeSessionPath)) {
            if (!autoMode) {
              console.error(chalk.red(`No active session found for profile: ${profile}`));
              process.exit(1);
            } else {
              logger.error(`Auto mode: No active session found for profile: ${profile}`);
              return;
            }
          }
        }
        
        // End the session
        const session: SessionData = await fs.readJson(activeSessionPath);
        const endTime = new Date();
        const startTime = new Date(session.startTime);
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000); // in seconds
        
        session.endTime = endTime.toISOString();
        session.duration = duration;
        
        // Archive the session
        const archiveDir = path.join(profileDir, 'archive');
        await fs.ensureDir(archiveDir);
        
        const archivePath = path.join(archiveDir, `session-${session.id}.json`);
        await fs.writeJson(archivePath, session, { spaces: 2 });
        
        // Remove active session
        await fs.remove(activeSessionPath);
        
        if (!autoMode) {
          console.log(chalk.green(`✓ Session ended`));
          console.log(`Session ID: ${chalk.blue(session.id)}`);
          console.log(`Profile: ${chalk.blue(session.profile)}`);
          console.log(`Amazon Q Profile: ${chalk.blue(session.qProfile)}`);
          console.log(`Duration: ${chalk.blue(formatDuration(duration))}`);
          console.log(`Started: ${chalk.blue(startTime.toLocaleString())}`);
          console.log(`Ended: ${chalk.blue(endTime.toLocaleString())}`);
        } else {
          logger.info(`Auto mode: Ended session ${session.id} for profile ${session.profile} with duration ${formatDuration(duration)}`);
        }
      } catch (error) {
        if (!options.autoMode) {
          console.error(chalk.red('Error ending session:'), error);
          process.exit(1);
        } else {
          logger.error(`Auto mode: Error ending session: ${error.message}`);
        }
      }
    });
}

/**
 * Format duration in seconds to a human-readable string
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}
