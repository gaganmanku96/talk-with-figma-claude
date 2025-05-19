const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

require('dotenv').config();

// Configuration
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3600;
const WEBSOCKET_HOST = process.env.WEBSOCKET_HOST || 'localhost';
const MCP_PORT = process.env.MCP_PORT || 3700;
const MCP_HOST = process.env.MCP_HOST || 'localhost';
const MONITOR_PORT = 3800;

// Create express app
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Create server status object
let serverStatus = {
  websocket: {
    running: false,
    status: 'Stopped',
    pid: null,
    uptime: 0,
    lastCheck: Date.now(),
    activeChannels: 0,
    connectedClients: 0,
    logs: []
  },
  mcp: {
    running: false,
    status: 'Stopped',
    pid: null,
    uptime: 0,
    lastCheck: Date.now(),
    logs: []
  },
  claude: {
    running: false,
    status: 'Stopped',
    pid: null,
    uptime: 0,
    lastCheck: Date.now(),
    logs: []
  }
};

//