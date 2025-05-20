// WebSocket server for Figma plugin communication
const WebSocket = require('ws');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.WEBSOCKET_PORT || 3600;
const HOST = process.env.WEBSOCKET_HOST || 'localhost';

console.log(`Starting WebSocket server on ${HOST}:${PORT}`);

// Create HTTP server and WebSocket server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active connections and channels
const connections = new Set();
const channels = new Map(); // channelId -> Set of client connections

// Handle new WebSocket connections
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`New WebSocket connection from ${clientIp}`);
  
  // Add to connections
  connections.add(ws);
  
  // Handle messages from clients
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`Received message of type: ${message.type}`);
      
      switch(message.type) {
        case 'join_channel':
          handleJoinChannel(ws, message);
          break;
        case 'leave_channel':
          handleLeaveChannel(ws, message);
          break;
        case 'figma_command':
          handleFigmaCommand(ws, message);
          break;
        case 'figma_response':
          handleFigmaResponse(ws, message);
          break;
        case 'ping':
          handlePing(ws, message);
          break;
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle disconnections
  ws.on('close', () => {
    console.log(`WebSocket connection closed from ${clientIp}`);
    
    // Remove from connections
    connections.delete(ws);
    
    // Remove from all channels
    for (const [channelId, clients] of channels.entries()) {
      if (clients.has(ws)) {
        clients.delete(ws);
        // Remove empty channels
        if (clients.size === 0) {
          channels.delete(channelId);
          console.log(`Channel ${channelId} deleted (no clients)`);
        }
      }
    }
  });
  
  // Send initial welcome message
  ws.send(JSON.stringify({ 
    type: 'welcome',
    message: 'Connected to Figma plugin WebSocket server',
    timestamp: Date.now()
  }));
});

// Handle join channel request
function handleJoinChannel(ws, message) {
  // Generate a channel ID if not provided
  const channelId = message.channelId || uuidv4();
  
  // Get or create channel
  if (!channels.has(channelId)) {
    channels.set(channelId, new Set());
  }
  
  // Add client to channel
  channels.get(channelId).add(ws);
  
  // Associate channel with client
  ws.channelId = channelId;
  
  console.log(`Client joined channel: ${channelId}`);
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'channel_joined',
    channelId,
    timestamp: Date.now()
  }));
}

// Handle leave channel request
function handleLeaveChannel(ws, message) {
  const channelId = message.channelId || ws.channelId;
  
  if (channelId && channels.has(channelId)) {
    // Remove client from channel
    channels.get(channelId).delete(ws);
    
    // Remove channel if empty
    if (channels.get(channelId).size === 0) {
      channels.delete(channelId);
      console.log(`Channel ${channelId} deleted (client left)`);
    }
    
    // Clear client's channel
    delete ws.channelId;
    
    console.log(`Client left channel: ${channelId}`);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'channel_left',
      channelId,
      timestamp: Date.now()
    }));
  }
}

// Handle Figma command (forward to all other clients in the channel)
function handleFigmaCommand(ws, message) {
  const { channelId, requestId, command, params } = message;
  
  if (!channelId) {
    console.error('Missing channelId in figma_command message');
    return;
  }
  
  if (!channels.has(channelId)) {
    console.error(`Channel ${channelId} not found`);
    
    // Send error response
    ws.send(JSON.stringify({
      type: 'figma_response',
      requestId,
      error: `Channel ${channelId} not found`
    }));
    return;
  }
  
  // Forward to all other clients in the channel
  const clients = channels.get(channelId);
  let forwardCount = 0;
  
  clients.forEach(client => {
    if (client !== ws) { // Don't send back to sender
      client.send(JSON.stringify(message));
      forwardCount++;
    }
  });
  
  console.log(`Forwarded figma_command '${command}' to ${forwardCount} clients in channel ${channelId}`);
  
  // If no other clients, send error response
  if (forwardCount === 0) {
    ws.send(JSON.stringify({
      type: 'figma_response',
      requestId,
      error: 'No Figma plugin connected to this channel. Make sure the plugin is running and connected to the same channel.'
    }));
  }
}

// Handle Figma response (forward to original requester)
function handleFigmaResponse(ws, message) {
  const { channelId, requestId } = message;
  
  if (!channelId || !requestId) {
    console.error('Missing channelId or requestId in figma_response message');
    return;
  }
  
  if (!channels.has(channelId)) {
    console.error(`Channel ${channelId} not found`);
    return;
  }
  
  // Forward to all other clients in the channel (usually just the MCP server)
  const clients = channels.get(channelId);
  let forwardCount = 0;
  
  clients.forEach(client => {
    if (client !== ws) { // Don't send back to sender
      client.send(JSON.stringify(message));
      forwardCount++;
    }
  });
  
  console.log(`Forwarded figma_response for request ${requestId} to ${forwardCount} clients in channel ${channelId}`);
}

// Handle ping (respond with pong)
function handlePing(ws, message) {
  ws.send(JSON.stringify({
    type: 'pong',
    timestamp: Date.now(),
    pingTimestamp: message.timestamp
  }));
}

// Start server
server.listen(PORT, HOST, () => {
  console.log(`WebSocket server running at ws://${HOST}:${PORT}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  
  // Close all connections
  for (const client of connections) {
    client.close();
  }
  
  // Close server
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

module.exports = server;