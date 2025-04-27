import { Command } from 'commander';
import { MCPServer } from '../server/mcp-server';
import { logger } from '../logger';

export const serverCommand = new Command('server')
  .description('Start the Model Context Protocol (MCP) server for AI chatbot integration')
  .option('-p, --port <port>', 'Port to run the server on', parseInt, 3000)
  .action(async (options) => {
    try {
      logger.info(`Starting MCP server on port ${options.port}...`);
      
      const server = new MCPServer(options.port);
      server.start();
      
      logger.info('MCP server started successfully');
      logger.info('Press Ctrl+C to stop the server');
      
      // Keep the process running
      process.on('SIGINT', () => {
        logger.info('Shutting down MCP server...');
        process.exit(0);
      });
    } catch (error) {
      logger.error(`Failed to start MCP server: ${error.message}`);
    }
  });
