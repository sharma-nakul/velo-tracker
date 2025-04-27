import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import * as https from 'https';
import { logger } from '../logger';
import { Feature, ProgressUpdate } from '../types';

// GitHub API helper function
const createGitHubIssue = async (
  token: string,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels: string[] = []
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      title,
      body,
      labels
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Velo-Chat-Logger',
        'Authorization': `token ${token}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          const issue = JSON.parse(responseData);
          resolve(issue.html_url);
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
};

// Helper functions for feature management
const getFeatureStoragePath = (): string => {
  const baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
  return path.join(baseDir, 'features.json');
};

const getProgressStoragePath = (): string => {
  const baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
  return path.join(baseDir, 'progress.json');
};

const loadFeatures = async (): Promise<Feature[]> => {
  const featuresPath = getFeatureStoragePath();
  
  if (await fs.pathExists(featuresPath)) {
    return fs.readJson(featuresPath);
  }
  
  return [];
};

const saveFeatures = async (features: Feature[]): Promise<void> => {
  const featuresPath = getFeatureStoragePath();
  const baseDir = path.dirname(featuresPath);
  
  await fs.ensureDir(baseDir);
  await fs.writeJson(featuresPath, features, { spaces: 2 });
};

const loadProgress = async (): Promise<ProgressUpdate[]> => {
  const progressPath = getProgressStoragePath();
  
  if (await fs.pathExists(progressPath)) {
    return fs.readJson(progressPath);
  }
  
  return [];
};

const saveProgress = async (progress: ProgressUpdate[]): Promise<void> => {
  const progressPath = getProgressStoragePath();
  const baseDir = path.dirname(progressPath);
  
  await fs.ensureDir(baseDir);
  await fs.writeJson(progressPath, progress, { spaces: 2 });
};

// Feature command implementation
export const featureCommand = new Command('feature')
  .description('Manage feature tracking for velo-tracker')
  .addCommand(
    new Command('add')
      .description('Add a new feature to track')
      .requiredOption('-n, --name <name>', 'Feature name')
      .requiredOption('-d, --description <description>', 'Feature description')
      .option('-p, --priority <priority>', 'Feature priority (low, medium, high)', 'medium')
      .option('-g, --github', 'Create a GitHub issue for this feature')
      .option('--github-token <token>', 'GitHub personal access token')
      .option('--github-owner <owner>', 'GitHub repository owner', 'sharma-nakul')
      .option('--github-repo <repo>', 'GitHub repository name', 'velo-tracker')
      .action(async (options) => {
        try {
          const features = await loadFeatures();
          
          // Validate priority
          const priority = options.priority.toLowerCase();
          if (!['low', 'medium', 'high'].includes(priority)) {
            logger.error('Invalid priority. Must be one of: low, medium, high');
            return;
          }
          
          // Create feature object
          const feature: Feature = {
            id: uuidv4(),
            name: options.name,
            description: options.description,
            status: 'planned',
            priority: priority as 'low' | 'medium' | 'high',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Create GitHub issue if requested
          if (options.github) {
            if (!options.githubToken) {
              logger.error('GitHub token is required to create an issue. Use --github-token option.');
              return;
            }
            
            try {
              const issueBody = `## Description\n${feature.description}\n\n## Priority\n${feature.priority}\n\n## Feature ID\n${feature.id}`;
              const issueUrl = await createGitHubIssue(
                options.githubToken,
                options.githubOwner,
                options.githubRepo,
                feature.name,
                issueBody,
                ['enhancement', `priority:${feature.priority}`]
              );
              
              if (issueUrl) {
                feature.issueUrl = issueUrl;
                logger.info(`Created GitHub issue: ${issueUrl}`);
              }
            } catch (error) {
              logger.error(`Failed to create GitHub issue: ${error.message}`);
            }
          }
          
          // Save feature
          features.push(feature);
          await saveFeatures(features);
          
          logger.info(`Added new feature: ${feature.name} (ID: ${feature.id})`);
        } catch (error) {
          logger.error(`Failed to add feature: ${error.message}`);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all tracked features')
      .option('-s, --status <status>', 'Filter by status (planned, in-progress, completed)')
      .option('-p, --priority <priority>', 'Filter by priority (low, medium, high)')
      .action(async (options) => {
        try {
          let features = await loadFeatures();
          
          // Apply filters
          if (options.status) {
            features = features.filter(f => f.status === options.status);
          }
          
          if (options.priority) {
            features = features.filter(f => f.priority === options.priority);
          }
          
          if (features.length === 0) {
            logger.info('No features found matching the criteria.');
            return;
          }
          
          // Display features
          console.log(chalk.bold('\nFeature Tracker:'));
          console.log(chalk.dim('─'.repeat(100)));
          console.log(
            chalk.bold('ID'.padEnd(10)) +
            chalk.bold('Name'.padEnd(30)) +
            chalk.bold('Status'.padEnd(15)) +
            chalk.bold('Priority'.padEnd(10)) +
            chalk.bold('GitHub Issue')
          );
          console.log(chalk.dim('─'.repeat(100)));
          
          for (const feature of features) {
            const shortId = feature.id.substring(0, 8);
            const statusColor = 
              feature.status === 'completed' ? chalk.green :
              feature.status === 'in-progress' ? chalk.yellow :
              chalk.blue;
            
            const priorityColor = 
              feature.priority === 'high' ? chalk.red :
              feature.priority === 'medium' ? chalk.yellow :
              chalk.gray;
            
            console.log(
              chalk.cyan(shortId.padEnd(10)) +
              feature.name.substring(0, 29).padEnd(30) +
              statusColor(feature.status.padEnd(15)) +
              priorityColor(feature.priority.padEnd(10)) +
              (feature.issueUrl || 'N/A')
            );
          }
          console.log(chalk.dim('─'.repeat(100)));
          
        } catch (error) {
          logger.error(`Failed to list features: ${error.message}`);
        }
      })
  )
  .addCommand(
    new Command('update')
      .description('Update a feature status')
      .requiredOption('-i, --id <id>', 'Feature ID')
      .requiredOption('-s, --status <status>', 'New status (planned, in-progress, completed)')
      .action(async (options) => {
        try {
          const features = await loadFeatures();
          const featureIndex = features.findIndex(f => f.id.startsWith(options.id));
          
          if (featureIndex === -1) {
            logger.error(`Feature with ID ${options.id} not found.`);
            return;
          }
          
          // Validate status
          const status = options.status.toLowerCase();
          if (!['planned', 'in-progress', 'completed'].includes(status)) {
            logger.error('Invalid status. Must be one of: planned, in-progress, completed');
            return;
          }
          
          // Update feature
          features[featureIndex].status = status as 'planned' | 'in-progress' | 'completed';
          features[featureIndex].updatedAt = new Date().toISOString();
          
          await saveFeatures(features);
          
          logger.info(`Updated feature ${features[featureIndex].name} status to ${status}`);
        } catch (error) {
          logger.error(`Failed to update feature: ${error.message}`);
        }
      })
  )
  .addCommand(
    new Command('progress')
      .description('Add a progress update for a feature')
      .requiredOption('-i, --id <id>', 'Feature ID')
      .requiredOption('-m, --message <message>', 'Progress update message')
      .requiredOption('-p, --percentage <percentage>', 'Completion percentage (0-100)', parseInt)
      .action(async (options) => {
        try {
          // Validate feature exists
          const features = await loadFeatures();
          const feature = features.find(f => f.id.startsWith(options.id));
          
          if (!feature) {
            logger.error(`Feature with ID ${options.id} not found.`);
            return;
          }
          
          // Validate percentage
          if (options.percentage < 0 || options.percentage > 100) {
            logger.error('Percentage must be between 0 and 100.');
            return;
          }
          
          // Create progress update
          const progress = await loadProgress();
          const update: ProgressUpdate = {
            id: uuidv4(),
            featureId: feature.id,
            message: options.message,
            percentage: options.percentage,
            createdAt: new Date().toISOString()
          };
          
          progress.push(update);
          await saveProgress(progress);
          
          // Update feature status based on progress
          if (options.percentage === 100 && feature.status !== 'completed') {
            feature.status = 'completed';
            feature.updatedAt = new Date().toISOString();
            await saveFeatures(features);
            logger.info(`Feature ${feature.name} marked as completed.`);
          } else if (options.percentage > 0 && options.percentage < 100 && feature.status === 'planned') {
            feature.status = 'in-progress';
            feature.updatedAt = new Date().toISOString();
            await saveFeatures(features);
            logger.info(`Feature ${feature.name} marked as in-progress.`);
          }
          
          logger.info(`Added progress update for feature ${feature.name}: ${options.percentage}% complete`);
        } catch (error) {
          logger.error(`Failed to add progress update: ${error.message}`);
        }
      })
  )
  .addCommand(
    new Command('show-progress')
      .description('Show progress updates for a feature')
      .requiredOption('-i, --id <id>', 'Feature ID')
      .action(async (options) => {
        try {
          // Validate feature exists
          const features = await loadFeatures();
          const feature = features.find(f => f.id.startsWith(options.id));
          
          if (!feature) {
            logger.error(`Feature with ID ${options.id} not found.`);
            return;
          }
          
          // Get progress updates for this feature
          const allProgress = await loadProgress();
          const featureProgress = allProgress.filter(p => p.featureId === feature.id);
          
          if (featureProgress.length === 0) {
            logger.info(`No progress updates found for feature: ${feature.name}`);
            return;
          }
          
          // Sort by creation date (newest first)
          featureProgress.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          
          // Display progress
          console.log(chalk.bold(`\nProgress for feature: ${feature.name}`));
          console.log(chalk.dim('─'.repeat(100)));
          console.log(
            chalk.bold('Date'.padEnd(20)) +
            chalk.bold('Percentage'.padEnd(15)) +
            chalk.bold('Message')
          );
          console.log(chalk.dim('─'.repeat(100)));
          
          for (const update of featureProgress) {
            const date = new Date(update.createdAt).toLocaleString();
            
            console.log(
              date.padEnd(20) +
              `${update.percentage}%`.padEnd(15) +
              update.message
            );
          }
          console.log(chalk.dim('─'.repeat(100)));
          
        } catch (error) {
          logger.error(`Failed to show progress: ${error.message}`);
        }
      })
  );
