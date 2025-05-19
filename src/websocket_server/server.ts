import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import http from 'http';

// Load environment variables
dotenv.config();

const PORT = process.env.WEBSOCKET_PORT || 3600;
const HOST = process.env.WEBSOCKET_HOST || 'localhost';

// Channel management
const channels: Record<string, Set<WebSocket>> = {};
const clientChannelMap = new Map<WebSocket, string>();

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      activeChannels: Object.keys(channels).length,
      connectedClients: wss ? wss.clients.size : 0,
      uptime: process.uptime()
    }));
    return;
  }

  res.writeHead(404);
  res.end();
});

// Create WebSocket server
const wss = new WebSocketServer({ 
  server,
  // Disable ping/pong for troubleshooting
  // pingInterval: 30000,
  // pingTimeout: 10000,
  // Increase max payload size
  maxPayload: 10 * 1024 * 1024, // 10MB
  // Keep connections alive even if inactive
  clientTracking: true
});

console.log(`WebSocket server starting on ${HOST}:${PORT}`);

// Log errors at the server level
wss.on('error', (error) => {
  console.error(`WebSocket server error: ${error.message}`);
});

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  // Handle messages
  ws.on('message', (message: Buffer) => {
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
ws.on('close', (code: number, reason: string) => {
  console.log(`Client disconnected. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
  console.log('Close details:', { code, reason, timestamp: new Date().toISOString() });
  
  const channelId = clientChannelMap.get(ws);
  if (channelId && channels[channelId]) {
  channels[channelId].delete(ws);
  console.log(`Removed client from channel: ${channelId}, remaining clients: ${channels[channelId].size}`);
    if (channels[channelId].size === 0) {
      delete channels[channelId];
      console.log(`Deleted empty channel: ${channelId}`);
    }
  }
  clientChannelMap.delete(ws);
});

// Handle errors
ws.on('error', (error: Error) => {
  console.error(`WebSocket client error: ${error.message}`);
});

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to WebSocket server' }));
});

// Handle joining a channel
function handleJoinChannel(ws: WebSocket, data: any) {
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
function forwardToChannel(sender: WebSocket, data: any) {
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
