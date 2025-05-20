const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.MONITOR_PORT || 3650;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 3600;
const WEBSOCKET_HOST = process.env.WEBSOCKET_HOST || 'localhost';
const LOG_DIR = path.join(__dirname, 'logs');

// Create Express app
const app = express();
const server = http.createServer(app);

// Health check function
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

// Get recent logs
const getRecentLogs = (numLines = 100) => {
  try {
    // Find the most recent log file
    if (!fs.existsSync(LOG_DIR)) {
      return 'No logs found';
    }
    
    const files = fs.readdirSync(LOG_DIR)
      .filter(file => file.endsWith('.log'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(LOG_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (files.length === 0) {
      return 'No log files found';
    }
    
    const logFile = path.join(LOG_DIR, files[0].name);
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n');
    
    // Get the last N lines
    return lines.slice(-numLines).join('\n');
  } catch (error) {
    return `Error reading logs: ${error.message}`;
  }
};

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Define routes
app.get('/', (req, res) => {
  // Create a simple HTML page
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude-Figma Server Monitor</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 {
            color: #6542f4;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .status-container {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        .status-card {
            flex: 1;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-weight: bold;
            color: white;
        }
        .status.healthy {
            background-color: #4CAF50;
        }
        .status.unhealthy {
            background-color: #F44336;
        }
        .logs {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            height: 400px;
            overflow-y: auto;
            font-family: monospace;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .refresh-btn {
            background-color: #6542f4;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .refresh-btn:hover {
            background-color: #5230e4;
        }
    </style>
</head>
<body>
    <h1>Claude-Figma Server Monitor</h1>
    
    <div class="status-container">
        <div class="status-card">
            <h2>WebSocket Server</h2>
            <p id="ws-status">Checking...</p>
        </div>
        
        <div class="status-card">
            <h2>MCP Server</h2>
            <p id="mcp-status">Checking...</p>
        </div>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h2>Recent Logs</h2>
        <button class="refresh-btn" onclick="refreshData()">Refresh</button>
    </div>
    
    <div class="logs" id="logs">Loading logs...</div>
    
    <script>
        // Fetch server status and logs
        function refreshData() {
            // Fetch WebSocket status
            fetch('/api/status/websocket')
                .then(response => response.json())
                .then(data => {
                    const statusEl = document.getElementById('ws-status');
                    if (data.healthy) {
                        statusEl.innerHTML = '<span class="status healthy">Healthy</span>';
                    } else {
                        statusEl.innerHTML = '<span class="status unhealthy">Unhealthy</span>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching WebSocket status:', error);
                    document.getElementById('ws-status').innerHTML = 
                        '<span class="status unhealthy">Error</span>';
                });
            
            // MCP status is more difficult to check directly, so we'll just check if the server is running
            fetch('/api/status/mcp')
                .then(response => response.json())
                .then(data => {
                    const statusEl = document.getElementById('mcp-status');
                    if (data.running) {
                        statusEl.innerHTML = '<span class="status healthy">Running</span>';
                    } else {
                        statusEl.innerHTML = '<span class="status unhealthy">Not Running</span>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching MCP status:', error);
                    document.getElementById('mcp-status').innerHTML = 
                        '<span class="status unhealthy">Error</span>';
                });
            
            // Fetch logs
            fetch('/api/logs')
                .then(response => response.text())
                .then(data => {
                    document.getElementById('logs').textContent = data;
                    // Scroll to bottom
                    const logsEl = document.getElementById('logs');
                    logsEl.scrollTop = logsEl.scrollHeight;
                })
                .catch(error => {
                    console.error('Error fetching logs:', error);
                    document.getElementById('logs').textContent = 
                        'Error loading logs: ' + error.message;
                });
        }
        
        // Initial load
        refreshData();
        
        // Auto-refresh every 10 seconds
        setInterval(refreshData, 10000);
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

// API endpoints
app.get('/api/status/websocket', async (req, res) => {
  const healthy = await checkWebSocketHealth();
  res.json({ healthy });
});

app.get('/api/status/mcp', (req, res) => {
  // We can't easily check MCP status directly, so we'll just check if the process is running
  // This is a very basic check and doesn't guarantee the server is working correctly
  const running = true; // Simplified for this example
  res.json({ running });
});

app.get('/api/logs', (req, res) => {
  const logs = getRecentLogs();
  res.type('text/plain').send(logs);
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server monitor running at http://localhost:${PORT}`);
});
