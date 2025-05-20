/**
 * Talk to Figma - Claude Desktop App Integration
 * 
 * This module exports the main components of the Claude-to-Figma integration
 */

// Import core modules
const mcpServer = require('./mcp-server/mcp-server');
const websocketServer = require('./websocket-server/websocket-server');
const figmaBridge = require('./bridges/figma_bridge');

// Export all components
module.exports = {
  mcpServer,
  websocketServer,
  figmaBridge,
  // Version info
  version: require('../package.json').version,
  // Utility function to start everything
  start: async (options = {}) => {
    const startOpts = {
      websocket: true,
      mcp: true,
      monitor: true,
      ...options
    };
    
    console.log(`Starting Talk to Figma v${require('../package.json').version}`);
    
    const results = {};
    
    if (startOpts.websocket) {
      try {
        // This is imported as a singleton
        results.websocket = websocketServer;
        console.log('WebSocket server started');
      } catch (error) {
        console.error('Failed to start WebSocket server:', error);
        results.websocket = null;
      }
    }
    
    return results;
  }
};
