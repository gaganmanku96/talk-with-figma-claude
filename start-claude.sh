#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate timestamp for logs
timestamp=$(date "+%Y-%m-%d_%H%M")
logdir="logs/${timestamp}"
mkdir -p "$logdir"

echo "Starting Talk to Figma for Claude Desktop..."
echo "Logs will be saved to $logdir"

# Start the WebSocket server in the background
echo "Starting WebSocket server..."
node dist/websocket_server/server.js > "$logdir/websocket.log" 2>&1 &
websocket_pid=$!

# Wait for the WebSocket server to start
echo "Waiting for WebSocket server to initialize..."
sleep 3

# Start the MCP server for Claude
echo "Starting MCP server for Claude..."
node mcp-server.js 2> "$logdir/claude.log"

# If we get here, the MCP server has exited
echo "MCP server has exited. Check logs in $logdir"

# Cleanup - kill WebSocket server
if kill -0 $websocket_pid 2>/dev/null; then
  echo "Stopping WebSocket server..."
  kill $websocket_pid
fi
