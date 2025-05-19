const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
require('dotenv').config();

const PORT = process.env.WEBSOCKET_PORT || 3600;
const HOST = process.env.WEBSOCKET_HOST || 'localhost';

// Channel management
const channels = {};
const clientChannelMap = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('WebSocket server is running');
    return;
  }

  res.writeHead(404);
  res.end();
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

console.log(`WebSocket server starting on ${HOST}:${PORT}`);

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'join_channel') {
        handleJoinChannel(ws, data);
      } else if (data.type === 'figma_command') {
        forwardToChannel(ws, data);
      } else if (data.type === 'figma_response') {
        forwardToChannel(ws, data);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    const channelId = clientChannelMap.get(ws);
    if (channelId && channels[channelId]) {
      channels[channelId].delete(ws);
      if (channels[channelId].size === 0) {
        delete channels[channelId];
      }
    }
    clientChannelMap.delete(ws);
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to WebSocket server' }));
});

// Handle joining a channel
function handleJoinChannel(ws, data) {
  let channelId = data.channelId;
  
  // If no channel ID is provided, generate a new one
  if (!channelId) {
    channelId = uuidv4();
  }
  
  // Create channel if it doesn't exist
  if (!channels[channelId]) {
    channels[channelId] = new Set();
  }
  
  // Add client to channel
  channels[channelId].add(ws);
  clientChannelMap.set(ws, channelId);
  
  console.log(`Client joined channel: ${channelId}`);
  ws.send(JSON.stringify({ 
    type: 'channel_joined', 
    channelId, 
    message: `Joined channel: ${channelId}` 
  }));
}

// Forward message to all clients in the channel except the sender
function forwardToChannel(sender, data) {
  const channelId = clientChannelMap.get(sender);
  if (!channelId || !channels[channelId]) {
    sender.send(JSON.stringify({ 
      type: 'error', 
      message: 'Not connected to a channel' 
    }));
    return;
  }
  
  channels[channelId].forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`WebSocket server running at http://${HOST}:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

module.exports = wss;
