/**
 * Amazon Q Integration Example
 * 
 * This example shows how to integrate velo-tracker with Amazon Q
 * by using the MCP client to track sessions and features.
 * 
 * To use this script:
 * 1. Start the MCP server: velo-tracker server
 * 2. Run this script when starting Amazon Q
 */

const { MCPClient } = require('velo-tracker');

// Create an MCP client
const client = new MCPClient('localhost', 3000);

// Get the AWS profile from environment or command line
const getAwsProfile = () => {
  // Check command line arguments
  const profileArg = process.argv.find(arg => arg.startsWith('--profile=') || arg === '--profile');
  if (profileArg === '--profile' && process.argv.indexOf(profileArg) < process.argv.length - 1) {
    return process.argv[process.argv.indexOf(profileArg) + 1];
  } else if (profileArg && profileArg.startsWith('--profile=')) {
    return profileArg.split('=')[1];
  }
  
  // Check environment variable
  if (process.env.AWS_PROFILE) {
    return process.env.AWS_PROFILE;
  }
  
  return 'default';
};

// Get the Amazon Q profile from command line
const getQProfile = () => {
  // Check command line arguments
  const profileArg = process.argv.find(arg => arg.startsWith('--q-profile=') || arg === '--q-profile');
  if (profileArg === '--q-profile' && process.argv.indexOf(profileArg) < process.argv.length - 1) {
    return process.argv[process.argv.indexOf(profileArg) + 1];
  } else if (profileArg && profileArg.startsWith('--q-profile=')) {
    return profileArg.split('=')[1];
  }
  
  return 'default';
};

// Start a session
async function startSession() {
  try {
    const awsProfile = getAwsProfile();
    const qProfile = getQProfile();
    
    console.log(`Starting velo-tracker session for AWS profile: ${awsProfile}, Q profile: ${qProfile}`);
    
    const session = await client.startSession(awsProfile, qProfile);
    console.log(`Session started with ID: ${session.id}`);
    
    // Store session ID for ending later
    process.env.VELO_SESSION_ID = session.id;
    
    return session;
  } catch (error) {
    console.error(`Failed to start session: ${error.message}`);
    return null;
  }
}

// End a session
async function endSession() {
  try {
    const awsProfile = getAwsProfile();
    
    console.log(`Ending velo-tracker session for AWS profile: ${awsProfile}`);
    
    const session = await client.endSession(awsProfile);
    console.log(`Session ended. Duration: ${session.duration} seconds`);
    
    return session;
  } catch (error) {
    console.error(`Failed to end session: ${error.message}`);
    return null;
  }
}

// Track feature progress
async function trackFeatureProgress(featureId, message, percentage) {
  try {
    const progress = await client.addProgress(featureId, message, percentage);
    console.log(`Progress update added: ${percentage}% - ${message}`);
    return progress;
  } catch (error) {
    console.error(`Failed to track progress: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  // Start session when script runs
  await startSession();
  
  // End session when process exits
  process.on('exit', async () => {
    await endSession();
  });
  
  // Handle signals
  process.on('SIGINT', async () => {
    await endSession();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await endSession();
    process.exit(0);
  });
}

// Run the main function
main().catch(console.error);

// Export functions for use in other scripts
module.exports = {
  startSession,
  endSession,
  trackFeatureProgress,
  client
};
