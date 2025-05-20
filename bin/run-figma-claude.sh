#!/bin/bash
#
# run-figma-claude.sh - Script to start the Talk to Figma - Claude integration
#

# Make script exit on any error
set -e

# Create logs directory
mkdir -p logs

# Generate timestamp for logs
timestamp=$(date "+%Y%m%d-%H%M%S")

echo "==============================================="
echo "Starting Talk to Figma for Claude Desktop"
echo "==============================================="

# Check for running processes that might conflict
echo "Checking for existing processes..."

# Check for running WebSocket server
ws_pid=$(pgrep -f "node.*websocket-server" || true)
if [ -n "$ws_pid" ]; then
  echo "Found existing WebSocket server (PID: $ws_pid). Stopping it..."
  kill $ws_pid
  sleep 1
fi

# Check for running MCP server
mcp_pid=$(pgrep -f "node.*mcp-server" || true)
if [ -n "$mcp_pid" ]; then
  echo "Found existing MCP server (PID: $mcp_pid). Stopping it..."
  kill $mcp_pid
  sleep 1
fi

# Check for running Claude bridge
bridge_pid=$(pgrep -f "node.*claude-bridge" || true)
if [ -n "$bridge_pid" ]; then
  echo "Found existing Claude bridge (PID: $bridge_pid). Stopping it..."
  kill $bridge_pid
  sleep 1
fi

echo "Done."

# Start WebSocket server
echo "Starting WebSocket server..."
node src/servers/websocket-server.js > logs/websocket-${timestamp}.log 2>&1 &
websocket_pid=$!
echo "WebSocket server started with PID: $websocket_pid"

# Wait for WebSocket server to start
echo "Waiting for WebSocket server to initialize..."
sleep 3

# Check if WebSocket server is still running
echo "Checking WebSocket server health..."
if kill -0 $websocket_pid 2>/dev/null; then
  echo "WebSocket server is running."
else
  echo "WebSocket server is not responding. Check logs at logs/websocket-${timestamp}.log"
  echo "Starting MCP server anyway..."
fi

# Start MCP server
echo "==============================================="
echo "Starting MCP server for Claude integration..."
echo "Logs will be saved to logs/mcp-${timestamp}.log"
echo "==============================================="
node src/servers/mcp-server.js > logs/mcp-${timestamp}.log 2>&1 &
mcp_pid=$!

# Wait for MCP server to start
sleep 2

# Start Claude bridge
echo "==============================================="
echo "Starting Claude bridge..."
echo "Logs will be saved to logs/claude-${timestamp}.log"
echo "==============================================="
node src/bridges/claude-bridge.js > logs/claude-${timestamp}.log 2>&1
bridge_exit=$?

echo "Claude bridge has exited."

# Clean up processes
echo "Shutting down WebSocket server..."
kill $websocket_pid 2>/dev/null || true

echo "Shutting down MCP server..."
kill $mcp_pid 2>/dev/null || true

echo "==============================================="
echo "All processes have been terminated."
echo "Check logs at:"
echo "  WebSocket server: logs/websocket-${timestamp}.log"
echo "  MCP server: logs/mcp-${timestamp}.log"
echo "  Claude bridge: logs/claude-${timestamp}.log"
echo "==============================================="

exit $bridge_exit
