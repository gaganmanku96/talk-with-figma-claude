#!/usr/bin/env node

/**
 * Claude Desktop App Figma MCP Connector
 * 
 * This script is a wrapper that starts both the WebSocket server and the MCP server
 * in a coordinated way for easier use with Claude Desktop App.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Configure logging
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `claude-figma-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  logStream.write(formattedMessage);
  console.error(formattedMessage);
}

log('Starting Claude to Figma connector...');

// Show setup guide
try {
  require('./show-guide');
} catch (error) {
  log(`Failed to show setup guide: ${error.message}`);
}

// Start the watchdog process which manages both servers
log('Starting watchdog process...');
const watchdog = spawn('node', [path.join(__dirname, 'watchdog.js')], {
  env: { ...process.env },
  stdio: ['inherit', 'pipe', 'pipe']
});

watchdog.stdout.on('data', (data) => {
  log(`[Watchdog] ${data.toString().trim()}`);
});

watchdog.stderr.on('data', (data) => {
  log(`[Watchdog] ${data.toString().trim()}`);
});

watchdog.on('close', (code) => {
  log(`Watchdog process exited with code ${code}`);
  process.exit(1);
});

// Handle process exit
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down...');
  if (watchdog && !watchdog.killed) {
    watchdog.kill();
  }
  setTimeout(() => {
    log('Forced exit after timeout');
    process.exit(1);
  }, 2000);
});

log('Startup script executed, services should be starting...');
