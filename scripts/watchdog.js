#!/usr/bin/env node

/**
 * Watchdog script for the Claude-to-Figma connection
 * 
 * This script monitors the health of both the WebSocket server and MCP server,
 * and restarts them if they appear to be disconnected or not responding.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3600;
const WEBSOCKET_HOST = process.env.WEBSOCKET_HOST || 'localhost';
const CHECK_INTERVAL = 30000; // 30 seconds
const LOG_FILE = path.join(__dirname, '..', 'logs', 'watchdog.log');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Setup logging
const log = (message) => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, entry);
  console.log(message);
};

log('Watchdog started');

// Track process references
let wsProcess = null;
let mcpProcess = null;

// Function to check WebSocket server health
const checkWebSocketHealth = () => {
  return new Promise((resolve) => {
    const req = http.get(`http://${WEBSOCKET_HOST}:${WEBSOCKET_PORT}/health`, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

// Function to start WebSocket server
const startWebSocketServer = () => {
  if (wsProcess) {
    try {
      wsProcess.kill();
    } catch (e) {
      // Ignore errors
    }
  }
  
  log('Starting WebSocket server...');
  wsProcess = spawn('node', [path.join(__dirname, '..', 'src', 'websocket-server', 'websocket-server.js')], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  wsProcess.stdout.on('data', (data) => {
    log(`[WS] ${data.toString().trim()}`);
  });
  
  wsProcess.stderr.on('data', (data) => {
    log(`[WS-ERR] ${data.toString().trim()}`);
  });
  
  wsProcess.on('close', (code) => {
    log(`WebSocket server exited with code ${code}`);
    wsProcess = null;
  });
  
  return wsProcess;
};

// Function to start MCP server
const startMCPServer = () => {
  if (mcpProcess) {
    try {
      mcpProcess.kill();
    } catch (e) {
      // Ignore errors
    }
  }
  
  log('Starting MCP server...');
  mcpProcess = spawn('node', [path.join(__dirname, '..', 'src', 'mcp-server', 'mcp-server.js')], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  mcpProcess.stdout.on('data', (data) => {
    log(`[MCP] ${data.toString().trim()}`);
  });
  
  mcpProcess.stderr.on('data', (data) => {
    log(`[MCP-ERR] ${data.toString().trim()}`);
  });
  
  mcpProcess.on('close', (code) => {
    log(`MCP server exited with code ${code}`);
    mcpProcess = null;
  });
  
  return mcpProcess;
};

// Start monitor server
const startMonitorServer = () => {
  log('Starting monitor server...');
  const monitorProcess = spawn('node', [path.join(__dirname, 'server-monitor.js')], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  monitorProcess.stdout.on('data', (data) => {
    log(`[Monitor] ${data.toString().trim()}`);
  });
  
  monitorProcess.stderr.on('data', (data) => {
    log(`[Monitor-ERR] ${data.toString().trim()}`);
  });
  
  monitorProcess.on('close', (code) => {
    log(`Monitor server exited with code ${code}`);
  });
  
  return monitorProcess;
};

// Initial startup
startWebSocketServer();
setTimeout(() => {
  startMCPServer();
  
  // Start monitor after a delay
  setTimeout(() => {
    startMonitorServer();
  }, 1000);
}, 2000);

// Set up health check interval
setInterval(async () => {
  log('Running health check...');
  
  // Check WebSocket server
  const wsHealth = await checkWebSocketHealth();
  if (!wsHealth) {
    log('WebSocket server appears to be down, restarting...');
    startWebSocketServer();
    
    // Wait a moment, then restart MCP server too to ensure clean connection
    setTimeout(() => {
      log('Restarting MCP server to reconnect...');
      startMCPServer();
    }, 2000);
  } else {
    log('WebSocket server is healthy');
    
    // Check if MCP process is still running
    if (!mcpProcess) {
      log('MCP server appears to be down, restarting...');
      startMCPServer();
    }
  }
}, CHECK_INTERVAL);

// Handle process exit
process.on('SIGINT', () => {
  log('Watchdog shutting down...');
  if (wsProcess) {
    wsProcess.kill();
  }
  if (mcpProcess) {
    mcpProcess.kill();
  }
  process.exit(0);
});
