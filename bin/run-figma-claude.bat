@echo off
REM run-figma-claude.bat - Script to start the Talk to Figma - Claude integration

echo ===============================================
echo Starting Talk to Figma for Claude Desktop
echo ===============================================

REM Create logs directory if it doesn't exist
if not exist logs mkdir logs

REM Generate timestamp for logs
for /F "tokens=2" %%i in ('date /t') do set date=%%i
set time=%time::=-%
set time=%time: =0%
set timestamp=%date%-%time:~0,8%

REM Clean up existing processes
echo Checking for existing processes...

REM Using taskkill to terminate any existing processes (ignore errors)
taskkill /f /im node.exe /fi "WINDOWTITLE eq Figma WebSocket Server" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq Figma MCP Server" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq Claude Bridge" 2>nul

echo Done.

REM Start WebSocket server
echo Starting WebSocket server...
start "Figma WebSocket Server" /min cmd /c "node src\servers\websocket-server.js > logs\websocket-%timestamp%.log 2>&1"

REM Wait for WebSocket server to start
echo Waiting for WebSocket server to initialize...
timeout /t 3 /nobreak > nul

REM Start MCP server
echo ===============================================
echo Starting MCP server for Claude integration...
echo Logs will be saved to logs\mcp-%timestamp%.log
echo ===============================================
start "Figma MCP Server" /min cmd /c "node src\servers\mcp-server.js > logs\mcp-%timestamp%.log 2>&1"

REM Wait for MCP server to start
timeout /t 2 /nobreak > nul

REM Start Claude bridge (foreground)
echo ===============================================
echo Starting Claude bridge...
echo Logs will be saved to logs\claude-%timestamp%.log
echo ===============================================
node src\bridges\claude-bridge.js > logs\claude-%timestamp%.log 2>&1

echo Claude bridge has exited.

REM Clean up processes
echo Shutting down servers...
taskkill /f /im node.exe /fi "WINDOWTITLE eq Figma WebSocket Server" 2>nul
taskkill /f /im node.exe /fi "WINDOWTITLE eq Figma MCP Server" 2>nul

echo ===============================================
echo All processes have been terminated.
echo Check logs at:
echo   WebSocket server: logs\websocket-%timestamp%.log
echo   MCP server: logs\mcp-%timestamp%.log
echo   Claude bridge: logs\claude-%timestamp%.log
echo ===============================================

pause
