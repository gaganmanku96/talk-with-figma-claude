// Entry point for the CLI
import { program } from 'commander';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get the current directory
const currentDir = process.cwd();

// Define the program
program
  .name('talk-to-figma-claude')
  .description('MCP integration between Claude Desktop and Figma')
  .version('0.1.0');

// Start WebSocket server command
program
  .command('start-websocket')
  .description('Start the WebSocket server')
  .option('-p, --port <port>', 'WebSocket server port', process.env.WEBSOCKET_PORT || '3600')
  .option('-h, --host <host>', 'WebSocket server host', process.env.WEBSOCKET_HOST || 'localhost')
  .action((options) => {
    console.log(`Starting WebSocket server on ${options.host}:${options.port}...`);
    process.env.WEBSOCKET_PORT = options.port;
    process.env.WEBSOCKET_HOST = options.host;

    try {
      require('./websocket_server/server');
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      process.exit(1);
    }
  });

// Start MCP server command
program
  .command('start-mcp')
  .description('Start the MCP server')
  .option('-p, --port <port>', 'MCP server port', process.env.MCP_PORT || '3700')
  .option('-h, --host <host>', 'MCP server host', process.env.MCP_HOST || 'localhost')
  .action((options) => {
    console.log(`Starting MCP server on ${options.host}:${options.port}...`);
    process.env.MCP_PORT = options.port;
    process.env.MCP_HOST = options.host;

    try {
      require('./mcp_server/server');
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  });

// Start all servers command
program
  .command('start')
  .description('Start both WebSocket and MCP servers')
  .action(() => {
    console.log('Starting all servers...');

    try {
      // Start WebSocket server
      console.log('Starting WebSocket server...');
      const websocketProcess = require('./websocket_server/server');

      // Start MCP server
      console.log('Starting MCP server...');
      const mcpProcess = require('./mcp_server/server');

      console.log('All servers started successfully!');
    } catch (error) {
      console.error('Failed to start servers:', error);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
