import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
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
 * Register the start command
 * @param program Commander program instance
 */
export function registerStartCommand(program: Command): void {
  program
    .command('start')
    .description('Start a new session')
    .option('-p, --profile <profile>', 'AWS profile name', 'default')
    .option('-q, --q-profile <qProfile>', 'Amazon Q profile name', 'default')
    .option('-a, --auto-mode', 'Started automatically by shell integration')
    .action(async (options) => {
      try {
        const sessionId = uuidv4();
        const profile = options.profile;
        const qProfile = options.qProfile;
        const autoMode = options.autoMode || false;
        
        // Create profile directory if it doesn't exist
        const profileDir = path.join(LOG_DIR, profile);
        await fs.ensureDir(profileDir);
        await fs.ensureDir(path.join(profileDir, 'archive'));
        
        // Check if there's already an active session
        const activeSessionPath = path.join(profileDir, 'active-session.json');
        
        if (await fs.pathExists(activeSessionPath)) {
          const activeSession = await fs.readJson(activeSessionPath);
          
          if (!autoMode) {
            console.log(chalk.yellow(`There's already an active session for profile '${profile}'`));
            console.log(`Session ID: ${chalk.blue(activeSession.id)}`);
            console.log(`Started: ${chalk.blue(new Date(activeSession.startTime).toLocaleString())}`);
            console.log(chalk.yellow(`Use 'velo-tracker end --profile ${profile}' to end the current session first`));
            return;
          } else {
            // In auto mode, end the previous session if it exists
            await fs.remove(activeSessionPath);
            logger.info(`Auto mode: Ended previous session ${activeSession.id} for profile ${profile}`);
          }
        }
        
        // Create new session
        const session: SessionData = {
          id: sessionId,
          profile,
          qProfile,
          startTime: new Date().toISOString(),
          autoMode
        };
        
        // Save active session
        await fs.writeJson(activeSessionPath, session, { spaces: 2 });
        
        if (!autoMode) {
          console.log(chalk.green(`✓ Session started`));
          console.log(`Session ID: ${chalk.blue(sessionId)}`);
          console.log(`Profile: ${chalk.blue(profile)}`);
          console.log(`Amazon Q Profile: ${chalk.blue(qProfile)}`);
          console.log(`Started: ${chalk.blue(new Date(session.startTime).toLocaleString())}`);
          console.log(chalk.yellow(`\nRemember to end your session with 'velo-tracker end --profile ${profile}'`));
        } else {
          logger.info(`Auto mode: Started session ${sessionId} for profile ${profile} with Q profile ${qProfile}`);
        }
      } catch (error) {
        if (!options.autoMode) {
          console.error(chalk.red('Error starting session:'), error);
          process.exit(1);
        } else {
          logger.error(`Auto mode: Error starting session: ${error.message}`);
        }
      }
    });
}
