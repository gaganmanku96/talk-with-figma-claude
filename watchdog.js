/**
 * Watchdog module to handle and recover from unexpected errors
 */
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Configuration
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_ERRORS = 5; // Maximum number of errors before taking action
const ERROR_RESET_TIME = 300000; // Reset error count after 5 minutes of stability
const LOG_PATH = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH);
}

// Error tracking
let errorCount = 0;
let lastErrorTime = 0;
let lastHealthyTime = Date.now();
let isRecovering = false;

// Create log file for this session
const logFile = path.join(LOG_PATH, `watchdog-${new Date().toISOString().replace(/:/g, '-')}.log`);

// Helper to log messages
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  console.error(logMessage);
  
  // Also log to file
  fs.appendFileSync(logFile, logMessage + '\n');
}

/**
 * Initialize watchdog
 * @param {Object} options Configuration options
 * @param {Function} options.getWebSocketClient Function to get current WebSocket client
 * @param {Function} options.getActiveChannelId Function to get current active channel ID
 * @param {Function} options.connectWebSocket Function to reconnect WebSocket
 */
function init({ getWebSocketClient, getActiveChannelId, connectWebSocket }) {
  log('Watchdog initialized');
  
  // Start periodic health check
  const intervalId = setInterval(() => {
    checkHealth(getWebSocketClient, getActiveChannelId, connectWebSocket);
  }, CHECK_INTERVAL);
  
  // Register process error handlers
  setupErrorHandlers(getWebSocketClient, connectWebSocket);
  
  return {
    stop: () => {
      clearInterval(intervalId);
      log('Watchdog stopped');
    }
  };
}

/**
 * Check health of the WebSocket connection
 */
function checkHealth(getWebSocketClient, getActiveChannelId, connectWebSocket) {
  const ws = getWebSocketClient();
  const now = Date.now();
  
  // Reset error count if it's been stable for a while
  if (errorCount > 0 && (now - lastErrorTime) > ERROR_RESET_TIME) {
    log(`No errors for ${Math.floor((now - lastErrorTime) / 1000)} seconds, resetting error count`);
    errorCount = 0;
  }
  
  // If we're already recovering, skip this check
  if (isRecovering) {
    return;
  }
  
  // Check WebSocket status
  if (!ws) {
    handleError('WebSocket client is null', getWebSocketClient, connectWebSocket);
    return;
  }
  
  if (ws.readyState === WebSocket.CLOSED) {
    handleError('WebSocket is closed', getWebSocketClient, connectWebSocket);
    return;
  }
  
  if (ws.readyState === WebSocket.CLOSING) {
    log('WebSocket is closing, waiting for it to complete', 'WARNING');
    return;
  }
  
  // Connection appears healthy
  lastHealthyTime = now;
}

/**
 * Handle error in WebSocket connection
 */
function handleError(message, getWebSocketClient, connectWebSocket) {
  log(`Error detected: ${message}`, 'ERROR');
  
  errorCount++;
  lastErrorTime = Date.now();
  
  // Decide what action to take based on error count
  if (errorCount >= MAX_ERRORS) {
    log(`Reached max error count (${MAX_ERRORS}), initiating recovery`, 'WARNING');
    recoverConnection(getWebSocketClient, connectWebSocket);
  } else {
    log(`Error count: ${errorCount}/${MAX_ERRORS}, monitoring...`, 'INFO');
  }
}

/**
 * Attempt to recover the connection
 */
function recoverConnection(getWebSocketClient, connectWebSocket) {
  if (isRecovering) {
    return;
  }
  
  isRecovering = true;
  log('Starting recovery process', 'INFO');
  
  // Close existing connection if it exists
  const ws = getWebSocketClient();
  if (ws) {
    try {
      ws.terminate();
      log('Terminated existing WebSocket connection', 'INFO');
    } catch (error) {
      log(`Error terminating WebSocket: ${error.message}`, 'ERROR');
    }
  }
  
  // Attempt to reconnect
  setTimeout(() => {
    try {
      log('Attempting to reconnect WebSocket', 'INFO');
      connectWebSocket();
      
      // Reset error count and recovery flag after a delay
      setTimeout(() => {
        errorCount = 0;
        isRecovering = false;
        log('Recovery process completed', 'INFO');
      }, 5000);
    } catch (error) {
      log(`Recovery failed: ${error.message}`, 'ERROR');
      isRecovering = false;
    }
  }, 1000);
}

/**
 * Setup global error handlers
 */
function setupErrorHandlers(getWebSocketClient, connectWebSocket) {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    
    // Check if it's a WebSocket error
    if (error.message.includes('WebSocket') || error.message.includes('ECONNREFUSED')) {
      handleError('WebSocket connection error (uncaught)', getWebSocketClient, connectWebSocket);
    }
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    const message = reason instanceof Error ? reason.message : String(reason);
    log(`Unhandled rejection: ${message}`, 'ERROR');
    
    // Check if it's a WebSocket error
    if (message.includes('WebSocket') || message.includes('ECONNREFUSED')) {
      handleError('WebSocket connection error (unhandled rejection)', getWebSocketClient, connectWebSocket);
    }
  });
}

module.exports = { init };
