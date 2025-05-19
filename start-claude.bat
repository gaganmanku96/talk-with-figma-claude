@echo off
echo Starting Talk to Figma for Claude Desktop...

:: Start the websocket server in the background
start "Figma WebSocket Server" cmd /c "node dist\websocket_server\server.js"

:: Wait a bit for the WebSocket server to start
timeout /t 3 /nobreak

:: Start the MCP server in stdio mode for Claude
echo Starting MCP server for Claude...
node mcp-server.js

:: If we get here, the server has exited
echo MCP server has exited. Press any key to close this window.
pause
