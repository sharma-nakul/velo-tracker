import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../logger';
import { Feature, ProgressUpdate, Session } from '../types';

/**
 * Model Context Protocol (MCP) Server
 * 
 * This server provides an API for AI chatbots to interact with velo-tracker
 * for tracking features, sessions, and progress updates.
 */
export class MCPServer {
  private app: express.Application;
  private port: number;
  private baseDir: string;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.baseDir = path.join(process.env.HOME || process.env.USERPROFILE || '.', '.velo-tracker');
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });

    // API version
    this.app.get('/api/version', (req, res) => {
      res.status(200).json({ version: '1.0.0' });
    });

    // Feature management routes
    this.setupFeatureRoutes();
    
    // Session management routes
    this.setupSessionRoutes();
    
    // Progress tracking routes
    this.setupProgressRoutes();

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error(`API Error: ${err.message}`);
      res.status(500).json({ error: err.message });
    });
  }

  private setupFeatureRoutes() {
    // Get all features
    this.app.get('/api/features', async (req, res) => {
      try {
        const features = await this.loadFeatures();
        
        // Apply filters if provided
        let filteredFeatures = features;
        if (req.query.status) {
          filteredFeatures = filteredFeatures.filter(f => f.status === req.query.status);
        }
        if (req.query.priority) {
          filteredFeatures = filteredFeatures.filter(f => f.priority === req.query.priority);
        }
        
        res.status(200).json(filteredFeatures);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get a specific feature
    this.app.get('/api/features/:id', async (req, res) => {
      try {
        const features = await this.loadFeatures();
        const feature = features.find(f => f.id === req.params.id || f.id.startsWith(req.params.id));
        
        if (!feature) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        
        res.status(200).json(feature);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create a new feature
    this.app.post('/api/features', async (req, res) => {
      try {
        const { name, description, priority, status = 'planned' } = req.body;
        
        if (!name || !description) {
          return res.status(400).json({ error: 'Name and description are required' });
        }
        
        if (priority && !['low', 'medium', 'high'].includes(priority)) {
          return res.status(400).json({ error: 'Priority must be low, medium, or high' });
        }
        
        if (status && !['planned', 'in-progress', 'completed'].includes(status)) {
          return res.status(400).json({ error: 'Status must be planned, in-progress, or completed' });
        }
        
        const features = await this.loadFeatures();
        
        const newFeature: Feature = {
          id: uuidv4(),
          name,
          description,
          status: status as 'planned' | 'in-progress' | 'completed',
          priority: (priority || 'medium') as 'low' | 'medium' | 'high',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        features.push(newFeature);
        await this.saveFeatures(features);
        
        res.status(201).json(newFeature);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Update a feature
    this.app.put('/api/features/:id', async (req, res) => {
      try {
        const { name, description, status, priority } = req.body;
        const features = await this.loadFeatures();
        const featureIndex = features.findIndex(f => f.id === req.params.id || f.id.startsWith(req.params.id));
        
        if (featureIndex === -1) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        
        if (status && !['planned', 'in-progress', 'completed'].includes(status)) {
          return res.status(400).json({ error: 'Status must be planned, in-progress, or completed' });
        }
        
        if (priority && !['low', 'medium', 'high'].includes(priority)) {
          return res.status(400).json({ error: 'Priority must be low, medium, or high' });
        }
        
        // Update feature properties
        if (name) features[featureIndex].name = name;
        if (description) features[featureIndex].description = description;
        if (status) features[featureIndex].status = status as 'planned' | 'in-progress' | 'completed';
        if (priority) features[featureIndex].priority = priority as 'low' | 'medium' | 'high';
        
        features[featureIndex].updatedAt = new Date().toISOString();
        
        await this.saveFeatures(features);
        
        res.status(200).json(features[featureIndex]);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Delete a feature
    this.app.delete('/api/features/:id', async (req, res) => {
      try {
        const features = await this.loadFeatures();
        const featureIndex = features.findIndex(f => f.id === req.params.id || f.id.startsWith(req.params.id));
        
        if (featureIndex === -1) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        
        const deletedFeature = features.splice(featureIndex, 1)[0];
        await this.saveFeatures(features);
        
        // Also delete related progress updates
        const progress = await this.loadProgress();
        const updatedProgress = progress.filter(p => p.featureId !== deletedFeature.id);
        await this.saveProgress(updatedProgress);
        
        res.status(200).json({ message: 'Feature deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupSessionRoutes() {
    // Get all sessions
    this.app.get('/api/sessions', async (req, res) => {
      try {
        const profile = req.query.profile as string || 'default';
        const qProfile = req.query.qProfile as string;
        const limit = parseInt(req.query.limit as string || '10');
        
        const profileDir = path.join(this.baseDir, 'logs', profile);
        const archiveDir = path.join(profileDir, 'archive');
        
        if (!await fs.pathExists(archiveDir)) {
          return res.status(200).json([]);
        }
        
        const files = await fs.readdir(archiveDir);
        const sessionFiles = files.filter(file => file.endsWith('.json'));
        
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
        }
        
        // Sort sessions by start time (newest first)
        filteredSessions.sort((a, b) => {
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        });
        
        // Limit the number of sessions
        const limitedSessions = filteredSessions.slice(0, limit);
        
        res.status(200).json(limitedSessions);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get active session
    this.app.get('/api/sessions/active', async (req, res) => {
      try {
        const profile = req.query.profile as string || 'default';
        const profileDir = path.join(this.baseDir, 'logs', profile);
        const activeSessionPath = path.join(profileDir, 'active-session.json');
        
        if (!await fs.pathExists(activeSessionPath)) {
          return res.status(404).json({ error: 'No active session found' });
        }
        
        const activeSession = await fs.readJson(activeSessionPath);
        res.status(200).json(activeSession);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Start a new session
    this.app.post('/api/sessions/start', async (req, res) => {
      try {
        const { profile = 'default', qProfile = 'default' } = req.body;
        
        // Create base directory structure if it doesn't exist
        const profileDir = path.join(this.baseDir, 'logs', profile);
        
        await fs.ensureDir(profileDir);
        await fs.ensureDir(path.join(profileDir, 'archive'));
        
        // Check if there's already an active session
        const activeSessionPath = path.join(profileDir, 'active-session.json');
        
        if (await fs.pathExists(activeSessionPath)) {
          return res.status(409).json({ 
            error: 'Active session already exists',
            session: await fs.readJson(activeSessionPath)
          });
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
        
        res.status(201).json(session);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // End an active session
    this.app.post('/api/sessions/end', async (req, res) => {
      try {
        const { profile = 'default', sessionId } = req.body;
        
        // Get base directory paths
        const profileDir = path.join(this.baseDir, 'logs', profile);
        const activeSessionPath = path.join(profileDir, 'active-session.json');
        
        // Check if there's an active session
        if (!await fs.pathExists(activeSessionPath)) {
          return res.status(404).json({ error: 'No active session found' });
        }
        
        // Read the active session
        const activeSession: Session = await fs.readJson(activeSessionPath);
        
        // If a specific session ID was provided, check if it matches
        if (sessionId && activeSession.id !== sessionId) {
          return res.status(400).json({ 
            error: 'Active session ID does not match requested session ID',
            activeSession
          });
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
        
        res.status(200).json(completedSession);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  private setupProgressRoutes() {
    // Get progress updates for a feature
    this.app.get('/api/progress/:featureId', async (req, res) => {
      try {
        const featureId = req.params.featureId;
        
        // Verify feature exists
        const features = await this.loadFeatures();
        const feature = features.find(f => f.id === featureId || f.id.startsWith(featureId));
        
        if (!feature) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        
        // Get progress updates
        const progress = await this.loadProgress();
        const featureProgress = progress.filter(p => p.featureId === feature.id);
        
        // Sort by creation date (newest first)
        featureProgress.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        res.status(200).json(featureProgress);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add a progress update
    this.app.post('/api/progress', async (req, res) => {
      try {
        const { featureId, message, percentage } = req.body;
        
        if (!featureId || !message || percentage === undefined) {
          return res.status(400).json({ error: 'Feature ID, message, and percentage are required' });
        }
        
        if (percentage < 0 || percentage > 100) {
          return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
        }
        
        // Verify feature exists
        const features = await this.loadFeatures();
        const feature = features.find(f => f.id === featureId || f.id.startsWith(featureId));
        
        if (!feature) {
          return res.status(404).json({ error: 'Feature not found' });
        }
        
        // Create progress update
        const progress = await this.loadProgress();
        const update: ProgressUpdate = {
          id: uuidv4(),
          featureId: feature.id,
          message,
          percentage,
          createdAt: new Date().toISOString()
        };
        
        progress.push(update);
        await this.saveProgress(progress);
        
        // Update feature status based on progress
        if (percentage === 100 && feature.status !== 'completed') {
          feature.status = 'completed';
          feature.updatedAt = new Date().toISOString();
          await this.saveFeatures(features);
        } else if (percentage > 0 && percentage < 100 && feature.status === 'planned') {
          feature.status = 'in-progress';
          feature.updatedAt = new Date().toISOString();
          await this.saveFeatures(features);
        }
        
        res.status(201).json(update);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  // Helper methods for data access
  private async loadFeatures(): Promise<Feature[]> {
    const featuresPath = path.join(this.baseDir, 'features.json');
    
    if (await fs.pathExists(featuresPath)) {
      return fs.readJson(featuresPath);
    }
    
    return [];
  }

  private async saveFeatures(features: Feature[]): Promise<void> {
    const featuresPath = path.join(this.baseDir, 'features.json');
    await fs.ensureDir(path.dirname(featuresPath));
    await fs.writeJson(featuresPath, features, { spaces: 2 });
  }

  private async loadProgress(): Promise<ProgressUpdate[]> {
    const progressPath = path.join(this.baseDir, 'progress.json');
    
    if (await fs.pathExists(progressPath)) {
      return fs.readJson(progressPath);
    }
    
    return [];
  }

  private async saveProgress(progress: ProgressUpdate[]): Promise<void> {
    const progressPath = path.join(this.baseDir, 'progress.json');
    await fs.ensureDir(path.dirname(progressPath));
    await fs.writeJson(progressPath, progress, { spaces: 2 });
  }

  // Server management
  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`MCP Server started on port ${this.port}`);
    });
  }
}
