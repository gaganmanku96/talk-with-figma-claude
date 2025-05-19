const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const readline = require('readline');
const { tools, initializeTools } = require('./tools');
const { EventEmitter } = require('events');

// Load environment variables
dotenv.config();

// Determine if we're running in stdio mode (when called by Claude Desktop)
const isStdioMode = !process.argv.includes('--http-only');
console.error(`Running in ${isStdioMode ? 'stdio' : 'HTTP'} mode`);

// Configure error handling
process.on('uncaughtException', (err) => {
  console.error(`Uncaught exception: ${err.message}`);
  console.error(err.stack);
  // Don't exit on uncaught exceptions in stdio mode
  if (!isStdioMode) {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled rejection: ${reason}`);
  // Don't exit on unhandled rejections in stdio mode
  if (!isStdioMode) {
    process.exit(1);
  }
});

const PORT = process.env.MCP_PORT || 3700;
const HOST = process.env.MCP_HOST || 'localhost';
const WEBSOCKET_URL = `ws://${process.env.WEBSOCKET_HOST || 'localhost'}:${process.env.WEBSOCKET_PORT || 3600}`;

// Initialize active channel ID
let activeChannelId = null;

// Create event emitter for stdio mode
const mcpEmitter = new EventEmitter();

// Set up readline interface for stdio mode
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Keep track of connection status
let isConnected = false;
let isShuttingDown = false;

// Only start the HTTP server if not in stdio mode or explicitly requested
let server;
let app;
if (!isStdioMode) {
  // Create express app and HTTP server
  app = express();
  server = http.createServer(app);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('MCP server is running');
  });
  
  // Setup SSE endpoint for Claude Desktop
  app.get('/sse', (req, res) => {
    console.log('SSE connection established');
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send initial ready message
    res.write('data: {"jsonrpc":"2.0","method":"ready","params":{}}\n\n');
    
    // Create a function to handle messages
    const messageHandler = (message) => {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    };
    
    // Register the event handler
    mcpEmitter.on('message', messageHandler);
    
    // Clean up on close
    req.on('close', () => {
      mcpEmitter.off('message', messageHandler);
      console.log('SSE connection closed');
    });
  });
  
  // MCP API endpoint using JSON-RPC 2.0
  app.post('/mcp', express.json(), (req, res) => {
    const request = req.body;
    console.log('Received MCP request:', JSON.stringify(request));
    
    // Process the JSON-RPC request
    handleMcpRequest(request)
      .then(response => {
        // Emit for SSE clients
        mcpEmitter.emit('message', response);
        res.json(response);
      })
      .catch(error => {
        console.error('Error handling MCP request:', error);
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: request.id || null,
        });
      });
  });
} else {
  console.error('Running in stdio mode, skipping HTTP server creation');
}

// Handle MCP requests (both HTTP and stdio)
async function handleMcpRequest(request) {
  // Check if it's a valid JSON-RPC 2.0 request
  if (!request.jsonrpc || request.jsonrpc !== '2.0') {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32600,
        message: 'Invalid request: not a valid JSON-RPC 2.0 request',
      },
      id: request.id || null,
    };
  }
  
  // Handle method calls
  if (request.method === 'initialize') {
    // Protocol initialization
    console.error('Handling initialize request');
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'talk-to-figma-claude',
          version: '0.1.0'  
        }
      }
    };
  } else if (request.method === 'tools/list') {
    // Return list of available tools
    const toolList = Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema || {
        type: 'object',
        properties: tool.parameters?.properties || {},
        required: tool.parameters?.required || []
      }
    }));
    
    return {
      jsonrpc: '2.0',
      result: {
        tools: toolList
      },
      id: request.id
    };
  } else if (request.method === 'tools/call') {
    // Execute a tool
    const { name, arguments: args } = request.params;
    
    if (!name) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32602,
          message: 'Invalid params: tool name is required',
        },
        id: request.id,
      };
    }
    
    if (!tools[name]) {
      return {
        jsonrpc: '2.0',
        error: {
          code: -32601,
          message: `Tool not found: ${name}`,
        },
        id: request.id,
      };
    }
    
    try {
      // Execute the tool
      let result = tools[name].handler(args || {});
      
      // If the result is a Promise, await it
      if (result instanceof Promise) {
        result = await result;
      }
      
      // Format the response
      let content;
      if (typeof result === 'string') {
        content = [{
          type: 'text',
          text: result
        }];
      } else {
        content = [{
          type: 'text',
          text: JSON.stringify(result)
        }];
      }
      
      return {
        jsonrpc: '2.0',
        result: {
          content
        },
        id: request.id
      };
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      return {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error.message || 'An error occurred',
        },
        id: request.id,
      };
    }
  } else if (request.method === 'resources/list') {
    // Return empty resources list
    return {
      jsonrpc: '2.0',
      result: {
        resources: []
      },
      id: request.id
    };
  } else if (request.method === 'prompts/list') {
    // Return empty prompts list
    return {
      jsonrpc: '2.0',
      result: {
        prompts: []
      },
      id: request.id
    };
  } else if (request.method === 'shutdown') {
    // Shutdown request
    console.error('Received shutdown request');
    
    // Mark that we're shutting down to prevent reconnection attempts
    isShuttingDown = true;
    
    // Send response before shutting down
    const response = {
      jsonrpc: '2.0',
      result: {},
      id: request.id
    };
    
    // Schedule shutdown after response is sent
    setTimeout(() => {
      console.error('Shutting down server...');
      process.exit(0);
    }, 100);
    
    return response;
  } else if (request.method === 'list_changed') {
    // Return empty list as we don't dynamically change tools
    return {
      jsonrpc: '2.0',
      result: {
        added: [],
        removed: []
      },
      id: request.id
    };
  } else {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32601,
        message: `Method not found: ${request.method}`,
      },
      id: request.id,
    };
  }
}

// Connect to WebSocket server
let ws = null;

// Simplified WebSocket connection
function connectWebSocket() {
  // Don't reconnect if shutting down or already connected/connecting
  if (isShuttingDown || (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING))) {
    return;
  }
  
  // Clean up old connection if exists and is closed
  if (ws && ws.readyState === WebSocket.CLOSED) {
    ws = null;
  }
  
  console.error(`Connecting to WebSocket server at: ${WEBSOCKET_URL}`);
  
  try {
    ws = new WebSocket(WEBSOCKET_URL);
    
    ws.on('open', () => {
      console.error('Successfully connected to WebSocket server');
      isConnected = true;
      
      // Re-join channel if we had one before
      if (activeChannelId) {
        console.error(`Attempting to rejoin channel: ${activeChannelId}`);
        ws.send(JSON.stringify({
          type: 'join_channel',
          channelId: activeChannelId
        }));
      }
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.error(`Received WebSocket message: ${JSON.stringify(message)}`);
        
        if (message.type === 'channel_joined') {
          activeChannelId = message.channelId;
          console.error(`Joined channel: ${activeChannelId}`);
          // Notify through stdout if we're in stdio mode
          if (isStdioMode) {
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              method: 'notification',
              params: {
                message: `Connected to Figma channel: ${activeChannelId}`
              }
            }) + '\n');
          }
        }
      } catch (error) {
        console.error(`Error parsing WebSocket message: ${error.message}`);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.error(`WebSocket connection closed. Code: ${code}, Reason: ${reason ? reason.toString() : 'Unknown'}`);
      isConnected = false;
      ws = null;
      
      // Only reconnect if not shutting down and not a normal closure
      if (!isShuttingDown && code !== 1000) {
        setTimeout(() => {
          console.error('Attempting to reconnect to WebSocket server...');
          connectWebSocket();
        }, 3000);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket connection error: ${error.message}`);
      // The 'close' event will handle reconnection
    });
  } catch (error) {
    console.error(`Failed to create WebSocket connection: ${error.message}`);
    isConnected = false;
    ws = null;
    
    if (!isShuttingDown) {
      setTimeout(() => {
        console.error('Retrying WebSocket connection...');
        connectWebSocket();
      }, 3000);
    }
  }
}

// Export WebSocket client for tools to use
function getWebSocketClient() {
  return ws;
}

// Export active channel ID
function getActiveChannelId() {
  return activeChannelId;
}

// Set active channel ID
function setActiveChannelId(channelId) {
  activeChannelId = channelId;
}

// Send a command to Figma through WebSocket
function sendFigmaCommand(command, params) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket is not connected'));
      return;
    }
    
    if (!activeChannelId) {
      reject(new Error('Not connected to a Figma channel. Use join_channel first.'));
      return;
    }
    
    const requestId = Date.now().toString();
    
    // Define message handler function
    const messageHandler = (data) => {
      try {
        const message = data.toString();
        const parsedData = JSON.parse(message);
        
        // Check if this is the response to our request
        if (parsedData.type === 'figma_response' && parsedData.requestId === requestId) {
          // Remove the event listener
          ws.off('message', messageHandler);
          
          if (parsedData.error) {
            reject(new Error(parsedData.error));
          } else {
            resolve(parsedData.result);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    // Add event listener for the response
    ws.on('message', messageHandler);
    
    // Send the command
    ws.send(JSON.stringify({
      type: 'figma_command',
      channelId: activeChannelId,
      requestId,
      command,
      params
    }));
    
    // Set timeout for the request
    setTimeout(() => {
      ws.off('message', messageHandler);
      reject(new Error('Figma command timed out'));
    }, 30000);
  });
}

// Set up stdin handling for stdio mode
rl.on('line', (line) => {
  // Skip empty lines
  if (!line.trim()) {
    return;
  }
  
  try {
    // Parse the JSON-RPC request
    const request = JSON.parse(line);
    console.error(`Received stdio request: ${JSON.stringify(request)}`);
    
    // Handle notifications (no response needed)
    if (request.method === 'notifications/initialized') {
      console.error('Received initialized notification');
      return; // No response for notifications
    }
    
    // Always respond to initialize, tools/list, and tools/call
    if (request.method === 'initialize' || request.method === 'tools/list' || 
        request.method === 'tools/call' || request.method === 'shutdown' ||
        request.method === 'resources/list' || request.method === 'prompts/list') {
      handleMcpRequest(request)
        .then(response => {
          // Emit the response
          mcpEmitter.emit('message', response);
          // Write the response to stdout
          process.stdout.write(JSON.stringify(response) + '\n');
          console.error(`Sent response for request ID: ${request.id}`);
        })
        .catch(error => {
          console.error(`Error handling stdio request: ${error.message}`);
          process.stdout.write(JSON.stringify({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: error.message || 'Internal server error',
            },
            id: request.id || null,
          }) + '\n');
        });
      return;
    }
    
    // Check WebSocket connection before processing other requests
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected. Attempting to reconnect...');
      // Try to reconnect if WebSocket is closed
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        connectWebSocket();
      }
      
      // Still send a response to avoid blocking Claude
      if (request.method === 'tools/call' && request.params?.name === 'join_channel') {
        // For join_channel requests, we'll indicate we're trying to connect
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'Attempting to connect to WebSocket server...',
                  status: 'connecting'
                })
              }
            ]
          },
          id: request.id
        }) + '\n');
      } else if (request.method === 'tools/call' && 
                (request.params?.name === 'connection_status' || 
                 request.params?.name === 'health_check' || 
                 request.params?.name === 'reconnect')) {
        // For diagnostic tools, process them even if WebSocket is down
        handleMcpRequest(request)
          .then(response => {
            mcpEmitter.emit('message', response);
            process.stdout.write(JSON.stringify(response) + '\n');
            console.error(`Sent response for request ID: ${request.id}`);
          })
          .catch(error => {
            console.error(`Error handling diagnostic request: ${error.message}`);
            process.stdout.write(JSON.stringify({
              jsonrpc: '2.0',
              error: {
                code: -32603,
                message: error.message || 'Internal server error',
              },
              id: request.id || null,
            }) + '\n');
          });
      } else {
        // For other requests, send a more generic error
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32002,
            message: 'WebSocket connection is not available. Attempting to reconnect...'
          },
          id: request.id || null
        }) + '\n');
      }
      return;
    }
    
    // Process the request
    handleMcpRequest(request)
      .then(response => {
        // Emit the response
        mcpEmitter.emit('message', response);
        // Write the response to stdout
        process.stdout.write(JSON.stringify(response) + '\n');
        console.error(`Sent response for request ID: ${request.id}`);
      })
      .catch(error => {
        console.error(`Error handling stdio request: ${error.message}`);
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error.message || 'Internal server error',
          },
          id: request.id || null,
        }) + '\n');
      });
  } catch (error) {
    console.error(`Error parsing stdio request: ${error.message}`);
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error: ' + error.message,
      },
      id: null,
    }) + '\n');
  }
});

// Handle possible premature termination
rl.on('close', () => {
  if (!isShuttingDown) {
    console.error('Readline interface closed unexpectedly');
  }
});

// Handle stdin end
process.stdin.on('end', () => {
  console.error('stdin ended, shutting down...');
  isShuttingDown = true;
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// Send ready message for stdio mode
if (isStdioMode) {
  // Don't send a ready message - Claude will send initialize first
  console.error('MCP server started in stdio mode');
  
  // Connect WebSocket in the background after a small delay
  setTimeout(() => {
    console.error('Connecting to WebSocket server...');
    connectWebSocket();
  }, 500);
}

// Start the server if not in stdio mode
if (!isStdioMode && server) {
  server.listen(PORT, () => {
    console.error(`MCP server running at http://${HOST}:${PORT}`);
  });
}

// Remove this duplicate call - we're already calling it in stdio mode
// Connect to WebSocket server is handled above in stdio mode section

// Remove this - causing issues
// process.stdin.resume();
// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down MCP server...');
  isShuttingDown = true;
  
  // Close the readline interface
  rl.close();
  
  // Close the HTTP server if it exists
  if (server) {
    server.close(() => {
      if (ws) {
        ws.close();
      }
      console.error('MCP server closed');
      process.exit(0);
    });
  } else {
    // If no HTTP server, just close WebSocket and exit
    if (ws) {
      ws.close();
    }
    console.error('MCP server closed');
    process.exit(0);
  }
});

// Export utilities for tools
const mcpServerExports = {
  getWebSocketClient,
  getActiveChannelId,
  setActiveChannelId,
  sendFigmaCommand
};

// Initialize tools with the exported functions
initializeTools(mcpServerExports);

// Go back to the original server in the config
// The v2 was just a test

module.exports = mcpServerExports;