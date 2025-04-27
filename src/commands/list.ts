import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as moment from 'moment';
import * as chalk from 'chalk';
import { logger } from '../logger';
import { Session } from '../types';

export const listCommand = new Command('list')
  .description('List Amazon Q session history')
  .option('-p, --profile <profile>', 'AWS profile to filter by')
  .option('-q, --q-profile <qProfile>', 'Amazon Q profile to filter by')
  .option('-l, --limit <limit>', 'Limit the number of sessions shown', parseInt, 10)
  .action(async (options) => {
    const profile = options.profile || process.env.AWS_PROFILE || 'default';
    const qProfile = options.qProfile;
    const limit = options.limit || 10;
    
    try {
      // Get base directory paths
      const baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
      const profileDir = path.join(baseDir, 'logs', profile);
      const archiveDir = path.join(profileDir, 'archive');
      
      // Check if directory exists
      if (!await fs.pathExists(archiveDir)) {
        logger.info(`No session history found for profile ${profile}`);
        return;
      }
      
      // Get all session files
      const files = await fs.readdir(archiveDir);
      const sessionFiles = files.filter(file => file.endsWith('.json'));
      
      if (sessionFiles.length === 0) {
        logger.info(`No session history found for profile ${profile}`);
        return;
      }
      
      // Read all sessions
      const sessions: Session[] = [];
      for (const file of sessionFiles) {
        const sessionPath = path.join(archiveDir, file);
        const session = await fs.readJson(sessionPath);
        sessions.push(session);
      }
      
      // Filter by Q profile if specified
      let filteredSessions = sessions;
      if (qProfile) {
        filteredSessions = sessions.filter(session => session.qProfile === qProfile);
        if (filteredSessions.length === 0) {
          logger.info(`No sessions found for Amazon Q profile ${qProfile}`);
          return;
        }
      }
      
      // Sort sessions by start time (newest first)
      filteredSessions.sort((a, b) => {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
      
      // Limit the number of sessions
      const limitedSessions = filteredSessions.slice(0, limit);
      
      // Display sessions
      console.log(chalk.bold(`\nSession history for profile ${profile}${qProfile ? ` and Amazon Q profile ${qProfile}` : ''} (showing ${limitedSessions.length} of ${filteredSessions.length}):`));
      console.log(chalk.dim('─'.repeat(100)));
      console.log(
        chalk.bold('ID'.padEnd(10)) +
        chalk.bold('Start Time'.padEnd(20)) +
        chalk.bold('End Time'.padEnd(20)) +
        chalk.bold('Duration'.padEnd(15)) +
        chalk.bold('AWS Profile'.padEnd(15)) +
        chalk.bold('Q Profile')
      );
      console.log(chalk.dim('─'.repeat(100)));
      
      for (const session of limitedSessions) {
        const startTime = moment(session.startTime).format('YYYY-MM-DD HH:mm:ss');
        const endTime = session.endTime ? moment(session.endTime).format('YYYY-MM-DD HH:mm:ss') : 'Active';
        
        let duration = 'N/A';
        if (session.duration !== null) {
          const durationObj = moment.duration(session.duration, 'seconds');
          duration = durationObj.hours() > 0 
            ? `${durationObj.hours()}h ${durationObj.minutes()}m ${durationObj.seconds()}s`
            : durationObj.minutes() > 0
              ? `${durationObj.minutes()}m ${durationObj.seconds()}s`
              : `${durationObj.seconds()}s`;
        }
        
        const shortId = session.id.substring(0, 8);
        
        console.log(
          chalk.cyan(shortId.padEnd(10)) +
          startTime.padEnd(20) +
          endTime.padEnd(20) +
          duration.padEnd(15) +
          session.profile.padEnd(15) +
          session.qProfile
        );
      }
      console.log(chalk.dim('─'.repeat(100)));
      
    } catch (error) {
      logger.error(`Failed to list sessions: ${error.message}`);
    }
  });
