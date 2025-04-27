import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as moment from 'moment';
import { logger } from '../logger';
import { Session } from '../types';

export const endCommand = new Command('end')
  .description('End an active Amazon Q session logging')
  .option('-p, --profile <profile>', 'AWS profile to use')
  .option('-s, --session-id <sessionId>', 'Specific session ID to end')
  .action(async (options) => {
    const profile = options.profile || process.env.AWS_PROFILE || 'default';
    const sessionId = options.sessionId;
    
    try {
      // Get base directory paths
      const baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
      const profileDir = path.join(baseDir, 'logs', profile);
      const activeSessionPath = path.join(profileDir, 'active-session.json');
      
      // Check if there's an active session
      if (!await fs.pathExists(activeSessionPath)) {
        logger.warn(`No active session found for profile ${profile}`);
        return;
      }
      
      // Read the active session
      const activeSession: Session = await fs.readJson(activeSessionPath);
      
      // If a specific session ID was provided, check if it matches
      if (sessionId && activeSession.id !== sessionId) {
        logger.warn(`Active session ID ${activeSession.id} does not match requested session ID ${sessionId}`);
        return;
      }
      
      // Update session with end time and duration
      const endTime = new Date();
      const startTime = new Date(activeSession.startTime);
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationSec = Math.floor(durationMs / 1000);
      
      const completedSession: Session = {
        ...activeSession,
        endTime: endTime.toISOString(),
        duration: durationSec
      };
      
      // Save the completed session to archive
      const archivePath = path.join(profileDir, 'archive', `${activeSession.id}.json`);
      await fs.writeJson(archivePath, completedSession, { spaces: 2 });
      
      // Remove the active session file
      await fs.remove(activeSessionPath);
      
      // Format duration for display
      const duration = moment.duration(durationSec, 'seconds');
      const formattedDuration = duration.hours() > 0 
        ? `${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`
        : duration.minutes() > 0
          ? `${duration.minutes()}m ${duration.seconds()}s`
          : `${duration.seconds()}s`;
      
      logger.info(`Ended session with ID ${activeSession.id} for profile ${profile}`);
      logger.info(`Session duration: ${formattedDuration}`);
      logger.info(`Amazon Q profile used: ${activeSession.qProfile}`);
      
    } catch (error) {
      logger.error(`Failed to end session: ${error.message}`);
    }
  });
