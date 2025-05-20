// claude-bridge.js - Enhanced bridge for Claude Desktop App using stdio
const http = require('http');
const readline = require('readline');
const { EventEmitter } = require('events');

// Configuration - the URL for the MCP server
const FIGMA_SERVER_URL = process.env.FIGMA_SERVER_URL || 'http://localhost:3700/mcp';
console.log(`Claude Desktop Bridge: Connecting to ${FIGMA_SERVER_URL}`);

// Create an event emitter for communication
const bridgeEvents = new EventEmitter();

// Set up stdin/stdout for MCP stdio communication
process.stdin.setEncoding('utf8');
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

// Track connection status
let connectionActive = false;
let pingInterval;
let lastMessageTime = Date.now();
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Function to connect to the MCP server
function connectToFigmaServer() {
  if (connectionActive) {
    console.log('Already connected, skipping connection attempt');
    return;
  }
  
  console.log('Connecting to Figma MCP server...');
  reconnectAttempts++;
  
  // Create HTTP request to the MCP server
  const req = http.request(FIGMA_SERVER_URL, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });

  req.on('response', (res) => {
    if (res.statusCode !== 200) {
      console.log(`Failed to connect to Figma server. Status: ${res.statusCode}`);
      scheduleReconnect();
      return;
    }
    
    console.log(`Connected to Figma server. Status: ${res.statusCode}`);
    connectionActive = true;
    reconnectAttempts = 0;
    lastMessageTime = Date.now();
    
    // Process incoming events
    res.setEncoding('utf8');
    let buffer = '';
    
    res.on('data', (chunk) => {
      lastMessageTime = Date.now();
      buffer += chunk;
      
      try {
        // Process data as individual lines/messages
        const messages = buffer.split('\n');
        // Keep any incomplete data in the buffer
        buffer = messages.pop() || '';
        
        for (const message of messages) {
          if (!message.trim()) continue;
          
          try {
            // Try to parse each line as JSON
            const parsed = JSON.parse(message);
            console.log('Received message from Figma server');
            
            // Forward to Claude
            process.stdout.write(message + '\n');
          } catch (parseErr) {
            // Not JSON, might be partial data or other format
            if (message.startsWith('data: ')) {
              // Handle SSE format
              const eventData = message.substring(6).trim();
              try {
                const parsed = JSON.parse(eventData);
                console.log('Received SSE message from Figma server');
                // Forward to Claude
                process.stdout.write(eventData + '\n');
              } catch (sseErr) {
                console.log('Error parsing SSE message, skipping:', sseErr.message);
              }
            } else {
              console.log('Error parsing message, skipping:', parseErr.message);
            }
          }
        }
      } catch (err) {
        console.log('Error processing data:', err);
      }
    });
    
    res.on('error', (err) => {
      console.log('Connection error:', err);
      connectionActive = false;
      scheduleReconnect();
    });
    
    res.on('end', () => {
      console.log('Connection closed by server');
      connectionActive = false;
      scheduleReconnect();
    });
    
    // Start ping interval to check connection health
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(checkConnectionHealth, 15000);
  });
  
  req.on('error', (err) => {
    console.log('Failed to connect to Figma server:', err);
    connectionActive = false;
    scheduleReconnect();
  });
  
  req.on('timeout', () => {
    console.log('Connection attempt timed out');
    req.destroy();
    connectionActive = false;
    scheduleReconnect();
  });
  
  // Set a timeout for the request
  req.setTimeout(10000);
  req.end();
}

// Function to check connection health and reconnect if needed
function checkConnectionHealth() {
  const now = Date.now();
  // If no message received in last 30 seconds, reconnect
  if (now - lastMessageTime > 30000 && connectionActive) {
    console.log('No message received in 30 seconds, reconnecting...');
    connectionActive = false;
    scheduleReconnect();
  }
}

// Schedule reconnection with backoff
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log(`Maximum reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    return;
  }
  
  // Exponential backoff with max of 30 seconds
  const delay = Math.min(Math.pow(2, reconnectAttempts) * 1000, 30000);
  console.log(`Scheduling reconnection attempt in ${delay}ms`);
  
  setTimeout(connectToFigmaServer, delay);
}

// Handle messages from Claude (stdin)
rl.on('line', async (line) => {
  if (!line) return;
  
  try {
    console.log('Received message from Claude, forwarding to Figma server');
    
    // Try to parse the message to extract request ID for error handling
    let requestId = null;
    try {
      const parsed = JSON.parse(line);
      requestId = parsed.id;
    } catch (parseErr) {
      console.log('Error parsing input from Claude (non-fatal):', parseErr);
    }
    
    // Forward Claude's message to Figma server
    const req = http.request(FIGMA_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(line)
      }
    });
    
    req.on('error', (err) => {
      console.log('Error sending message to Figma server:', err);
      
      // Send error response to Claude if we have a request ID
      if (requestId) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32000,
            message: `Failed to communicate with Figma server: ${err.message}`
          }
        }) + '\n');
      }
      
      // Check connection status and reconnect if needed
      connectionActive = false;
      scheduleReconnect();
    });
    
    // We need to parse the response carefully
    req.on('response', (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (responseData) {
          console.log('Received response from Figma server');
          
          // Check if it's JSON before forwarding
          if (responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
            try {
              // Validate JSON but pass through the original string
              JSON.parse(responseData);
              // Forward to Claude
              process.stdout.write(responseData + '\n');
            } catch (err) {
              console.log('Response is not valid JSON:', err.message);
              
              // Send an error response to Claude if we have a request ID
              if (requestId) {
                process.stdout.write(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestId,
                  error: {
                    code: -32001,
                    message: 'Figma server returned an invalid response'
                  }
                }) + '\n');
              }
            }
          } else {
            console.log('Response is not JSON (likely HTML)');
            
            // Send an error response to Claude if we have a request ID
            if (requestId) {
              process.stdout.write(JSON.stringify({
                jsonrpc: '2.0',
                id: requestId,
                error: {
                  code: -32002,
                  message: 'Figma server returned non-JSON response'
                }
              }) + '\n');
            }
          }
        } else if (res.statusCode !== 200) {
          console.log(`Figma server returned status code: ${res.statusCode}`);
          
          // Send an error response to Claude if we have a request ID
          if (requestId) {
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              id: requestId,
              error: {
                code: -32003,
                message: `Figma server returned status code: ${res.statusCode}`
              }
            }) + '\n');
          }
        }
      });
    });
    
    // Write the message and end the request
    req.write(line);
    req.end();
  } catch (err) {
    console.log('Error processing input:', err);
  }
});

// Start connection
connectToFigmaServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  if (pingInterval) clearInterval(pingInterval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  if (pingInterval) clearInterval(pingInterval);
  process.exit(0);
});

// Handle stdin end
process.stdin.on('end', () => {
  console.log('stdin ended, shutting down...');
  if (pingInterval) clearInterval(pingInterval);
  process.exit(0);
});

// Enable error logging
process.on('uncaughtException', (err) => {
  console.log('Uncaught exception:', err);
  // Don't exit to keep the bridge running
});