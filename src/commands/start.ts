import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as moment from 'moment';
import { logger } from '../logger';
import { Session } from '../types';

export const startCommand = new Command('start')
  .description('Start a new Amazon Q session logging')
  .option('-p, --profile <profile>', 'AWS profile to use')
  .option('-q, --q-profile <qProfile>', 'Amazon Q profile to use')
  .action(async (options) => {
    const profile = options.profile || process.env.AWS_PROFILE || 'default';
    const qProfile = options.qProfile || 'default';
    
    try {
      // Create base directory structure if it doesn't exist
      const baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
      const profileDir = path.join(baseDir, 'logs', profile);
      
      await fs.ensureDir(profileDir);
      await fs.ensureDir(path.join(profileDir, 'archive'));
      
      // Check if there's already an active session
      const activeSessionPath = path.join(profileDir, 'active-session.json');
      
      if (await fs.pathExists(activeSessionPath)) {
        const activeSession = await fs.readJson(activeSessionPath);
        logger.warn(`There is already an active session for profile ${profile} started at ${moment(activeSession.startTime).format('YYYY-MM-DD HH:mm:ss')}`);
        logger.warn('Use "velo-tracker end" to end the active session before starting a new one');
        return;
      }
      
      // Create a new session
      const sessionId = uuidv4();
      const session: Session = {
        id: sessionId,
        profile,
        qProfile,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null
      };
      
      // Save the active session
      await fs.writeJson(activeSessionPath, session, { spaces: 2 });
      
      logger.info(`Started new session with ID ${sessionId} for profile ${profile} with Amazon Q profile ${qProfile}`);
      
    } catch (error) {
      logger.error(`Failed to start session: ${error.message}`);
    }
  });
