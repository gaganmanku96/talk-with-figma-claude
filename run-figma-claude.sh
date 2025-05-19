#!/usr/bin/env bash

# Simple run script for Talk to Figma Claude integration

echo "==============================================="
echo "Starting Talk to Figma for Claude Desktop"
echo "==============================================="

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill any existing processes
echo "Checking for existing processes..."
pkill -f "node.*websocket_server" 2>/dev/null || true
pkill -f "node.*mcp-server" 2>/dev/null || true
echo "Done."

# Wait a bit to ensure processes are terminated
sleep 1

# Current timestamp for logs
timestamp=$(date +"%Y%m%d-%H%M%S")
websocket_log="logs/websocket-$timestamp.log"
mcp_log="logs/mcp-$timestamp.log"

echo "Starting WebSocket server..."
# Start the WebSocket server in the background and capture its PID
node dist/websocket_server/server.js > "$websocket_log" 2>&1 &
websocket_pid=$!

# Check if process started successfully
if ! ps -p $websocket_pid > /dev/null; then
  echo "Failed to start WebSocket server!"
  exit 1
fi

echo "WebSocket server started with PID: $websocket_pid"
echo "Waiting for WebSocket server to initialize..."
sleep 3

# Verify WebSocket server is running by checking the health endpoint
echo "Checking WebSocket server health..."
if command -v curl &> /dev/null; then
  if ! curl -s http://localhost:3600/health > /dev/null; then
    echo "WebSocket server is not responding. Check logs at $websocket_log"
    echo "Starting MCP server anyway..."
  else
    echo "WebSocket server is running."
  fi
else
  # If curl is not available, just assume it's running
  echo "Curl not available. Assuming WebSocket server is running."
fi

# Start the MCP server (stdio mode) using the fixed version
echo "==============================================="
echo "Starting MCP server for Claude integration..."
echo "Logs will be saved to $mcp_log"
echo "==============================================="

# Use the fixed version
node mcp-server-fixed.js 2> "$mcp_log"

# If we get here, the MCP server has exited
echo "MCP server has exited."

# Kill the WebSocket server if it's still running
if ps -p $websocket_pid > /dev/null; then
  echo "Shutting down WebSocket server..."
  kill $websocket_pid 2>/dev/null || true
fi

echo "==============================================="
echo "All processes have been terminated."
echo "Check logs at:"
echo "  WebSocket server: $websocket_log"
echo "  MCP server: $mcp_log"
echo "==============================================="
