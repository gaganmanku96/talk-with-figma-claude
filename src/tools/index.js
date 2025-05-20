// Combine and export all Figma tools
const { basicTools, initializeBasicTools } = require('./basic-tools');
const { enhancedTools, initializeEnhancedTools } = require('./enhanced-tools');

// Combine all tools into a single object
const allTools = {
  // First add basic tools
  ...basicTools,
  
  // Then add enhanced tools - these will override any basic tools with the same name
  ...enhancedTools
};

// Initialize both basic and enhanced tools
function initializeTools(mcpServer) {
  initializeBasicTools(mcpServer);
  initializeEnhancedTools(mcpServer);
}

module.exports = { tools: allTools, initializeTools };