import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';
import { tools } from './tools';
import { handleWebSocketMessage } from './websocketClient';

// Redirect console.log to console.error to avoid interfering with JSON-RPC
const originalConsoleLog = console.log;
console.log = (...args) => {
  console.error(...args);
};

// Load environment variables
dotenv.config();

const PORT = process.env.MCP_PORT || 3700;
const HOST = process.env.MCP_HOST || 'localhost';
const WEBSOCKET_URL = `ws://${process.env.WEBSOCKET_HOST || 'localhost'}:${process.env.WEBSOCKET_PORT || 3600}`;

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create MCP server
const mcpServer = new McpServer({
  name: "talk-to-figma-claude",
  version: "0.1.0"
});

// Register tools with the MCP server
Object.entries(tools).forEach(([name, toolDef]) => {
  // Convert the parameters to Zod schema
  const paramsObj: Record<string, any> = {};

  if (toolDef.parameters && toolDef.parameters.properties) {
    Object.entries(toolDef.parameters.properties).forEach(([paramName, paramDef]: [string, any]) => {
      if (paramDef.type === 'string') {
        paramsObj[paramName] = z.string().describe(paramDef.description || '');
      } else if (paramDef.type === 'number') {
        paramsObj[paramName] = z.number().describe(paramDef.description || '');
      } else if (paramDef.type === 'boolean') {
        paramsObj[paramName] = z.boolean().describe(paramDef.description || '');
      } else if (paramDef.type === 'array') {
        if (paramDef.items && paramDef.items.type === 'string') {
          paramsObj[paramName] = z.array(z.string()).describe(paramDef.description || '');
        } else if (paramDef.items && paramDef.items.type === 'number') {
          paramsObj[paramName] = z.array(z.number()).describe(paramDef.description || '');
        } else if (paramDef.items && paramDef.items.type === 'object') {
          paramsObj[paramName] = z.array(z.any()).describe(paramDef.description || '');
        } else {
          paramsObj[paramName] = z.array(z.any()).describe(paramDef.description || '');
        }
      } else if (paramDef.type === 'object') {
        paramsObj[paramName] = z.object({}).describe(paramDef.description || '');
      } else {
        paramsObj[paramName] = z.any().describe(paramDef.description || '');
      }
    });
  }

  // Register the tool with the MCP server
  mcpServer.tool(
    name,
    toolDef.description || name,
    paramsObj,
    async (params) => {
      try {
        const result = await toolDef.handler(params);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error: any) {
        console.error(`Error executing tool ${name}:`, error);
        throw new Error(error.message || 'An error occurred');
      }
    }
  );
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('MCP server is running');
});

// Create an event emitter for SSE
const sseEmitter = new EventEmitter();
// Set a higher limit for event listeners
sseEmitter.setMaxListeners(100);

// Add SSE endpoint for Claude Desktop
app.get('/sse', (req, res) => {
  console.log('SSE connection established');
  
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Send initial connection message
  res.write('data: {"jsonrpc":"2.0","method":"ready","params":{}}\n\n');
  
  // Create a function to handle messages
  const messageHandler = (message: any) => {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
  };
  
  // Register the event handler
  sseEmitter.on('message', messageHandler);
  
  // Clean up on close
  req.on('close', () => {
    sseEmitter.off('message', messageHandler);
    console.log('SSE connection closed');
  });
});

// No WebSocket connection needed for now
let ws: WebSocket | null = null;

// Export WebSocket client for tools to use
export function getWebSocketClient() {
  return ws;
}

// Start the server
app.use(express.json());

// Set up MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    // Create a custom response handler to also emit events for SSE
    const customResponseHandler = (response: any) => {
      // Emit response to SSE clients
      sseEmitter.emit('message', response);
    };

    // Create a transport for this request
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    // Connect the MCP server to the transport
    await mcpServer.connect(transport);

    // Intercept the response
    const originalWrite = res.write;
    res.write = function(chunk: any) {
      try {
        const jsonData = JSON.parse(chunk.toString());
        // Emit the message to SSE clients
        customResponseHandler(jsonData);
      } catch (e) {
        console.error('Error parsing response:', e);
      }
      return originalWrite.apply(res, arguments);
    };

    // Handle the request using the transport
    await transport.handleRequest(req, res, req.body);

    // Clean up when the request is done
    res.on('close', () => {
      transport.close();
    });
  } catch (error: any) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

server.listen(PORT, () => {
  console.log(`MCP server running at http://${HOST}:${PORT}`);
  connectWebSocket();
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MCP server...');
  server.close(() => {
    if (ws) {
      ws.close();
    }
    console.log('MCP server closed');
    process.exit(0);
  });
});

