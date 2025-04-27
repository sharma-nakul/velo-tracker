/**
 * Cursor AI Integration Example
 * 
 * This example shows how to integrate velo-tracker with Cursor AI
 * by using the MCP client to track feature development and progress.
 * 
 * To use this script:
 * 1. Start the MCP server: velo-tracker server
 * 2. Import this module in your Cursor AI extension
 */

const { MCPClient } = require('velo-tracker');

// Create an MCP client
const client = new MCPClient('localhost', 3000);

// Current session tracking
let currentSession = null;

/**
 * Start a Cursor AI development session
 * @param {string} projectName - Name of the project (used as profile)
 * @param {string} aiModel - AI model being used (used as Q profile)
 */
async function startCursorSession(projectName, aiModel = 'default') {
  try {
    console.log(`Starting velo-tracker session for project: ${projectName}, model: ${aiModel}`);
    
    currentSession = await client.startSession(projectName, aiModel);
    console.log(`Session started with ID: ${currentSession.id}`);
    
    return currentSession;
  } catch (error) {
    console.error(`Failed to start session: ${error.message}`);
    return null;
  }
}

/**
 * End the current Cursor AI development session
 */
async function endCursorSession() {
  if (!currentSession) {
    console.log('No active session to end');
    return null;
  }
  
  try {
    console.log(`Ending velo-tracker session for project: ${currentSession.profile}`);
    
    const session = await client.endSession(currentSession.profile, currentSession.id);
    console.log(`Session ended. Duration: ${session.duration} seconds`);
    
    currentSession = null;
    return session;
  } catch (error) {
    console.error(`Failed to end session: ${error.message}`);
    return null;
  }
}

/**
 * Create a new feature to track
 * @param {string} name - Feature name
 * @param {string} description - Feature description
 * @param {string} priority - Priority level (low, medium, high)
 */
async function createFeature(name, description, priority = 'medium') {
  try {
    const feature = await client.createFeature(name, description, priority);
    console.log(`Created feature: ${name} (ID: ${feature.id})`);
    return feature;
  } catch (error) {
    console.error(`Failed to create feature: ${error.message}`);
    return null;
  }
}

/**
 * Update feature progress
 * @param {string} featureId - ID of the feature
 * @param {string} message - Progress update message
 * @param {number} percentage - Completion percentage (0-100)
 */
async function updateFeatureProgress(featureId, message, percentage) {
  try {
    const progress = await client.addProgress(featureId, message, percentage);
    console.log(`Progress update added: ${percentage}% - ${message}`);
    return progress;
  } catch (error) {
    console.error(`Failed to update progress: ${error.message}`);
    return null;
  }
}

/**
 * Get all features with their status
 * @param {string} status - Filter by status (optional)
 */
async function getFeatures(status) {
  try {
    const features = await client.getFeatures(status);
    return features;
  } catch (error) {
    console.error(`Failed to get features: ${error.message}`);
    return [];
  }
}

/**
 * Get progress history for a feature
 * @param {string} featureId - ID of the feature
 */
async function getFeatureProgress(featureId) {
  try {
    const progress = await client.getProgress(featureId);
    return progress;
  } catch (error) {
    console.error(`Failed to get feature progress: ${error.message}`);
    return [];
  }
}

// Export functions for use in Cursor AI
module.exports = {
  startCursorSession,
  endCursorSession,
  createFeature,
  updateFeatureProgress,
  getFeatures,
  getFeatureProgress,
  client
};
