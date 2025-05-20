# Talk to Figma for Claude Desktop

This project allows Claude Desktop to control Figma through the MCP (Model Context Protocol). It enables natural language interaction with Figma, allowing you to create, edit, and manipulate designs using Claude.

## Prerequisites

1. **Node.js** - v16 or higher
2. **Claude Desktop** - With the MCP tools functionality enabled
3. **Figma Desktop** - With the Figma Plugin installed

## Quick Start

1. Clone this repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build` 
4. Validate your setup: `npm run validate`
5. Start for Claude: `npm run start:claude` or run `start-claude.bat`

## Setup - Detailed Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Validate Your Setup

Run the validation script to ensure everything is properly configured:

```bash
npm run validate
```

This script will check:
- If required environment variables are set
- If all necessary files exist
- If the WebSocket server is running
- If the MCP server is running

### 4. Start the Servers

For Claude Desktop integration, use either:

```bash
npm run start:claude
```

Or simply run the batch file:

```bash
start-claude.bat
```

## Using with Claude Desktop

1. Start the servers using the steps above
2. Open Claude Desktop
3. Enable the "Talk to Figma" tool in Claude's Tools menu
4. Open Figma and the Figma plugin
5. Join the same channel in both Claude and Figma
6. Now you can ask Claude to manipulate your Figma designs!

## Debugging Connection Issues

If you experience disconnection issues between Claude and Figma, try the following steps:

### 1. Check Server Status

Run the validation script to check if all servers are running:

```bash
npm run validate
```

### 2. Clean Up Existing Processes

If servers are hanging, run the cleanup script:

```bash
cleanup.bat
```

### 3. Test STDIO Communication

Test if the MCP server can properly handle stdin/stdout communication:

```bash
npm run test:stdio
```

Once the test script is running, type:
- `init` - to initialize the connection
- `list` - to list available tools
- `join` - to test joining a channel
- `exit` - to exit the test

### 4. Check Logs

Capture detailed logs for troubleshooting:

```bash
start-claude.bat > stdout.log 2> stderr.log
```

### 5. Ensure WebSocket Server is Accessible

Verify the WebSocket server is running and accessible by visiting:

```
http://localhost:3600/health
```

## Common Issues and Solutions

### 1. MCP Server Disconnects

**Problem**: Claude loses connection to the MCP server

**Solutions**:
- Check if the WebSocket server is running
- Verify firewall settings aren't blocking the connection
- Make sure both Claude and Figma are joined to the same channel
- Restart both servers with `cleanup.bat` followed by `start-claude.bat`

### 2. Figma Plugin Can't Connect

**Problem**: The Figma plugin reports it can't connect to the server

**Solutions**:
- Verify the WebSocket server is running (`npm run validate`)
- Check if the plugin is trying to connect to the correct address/port
- Try restarting the Figma desktop application

### 3. Claude Shows Tool as Disconnected

**Problem**: Claude shows the "Talk to Figma" tool as disconnected

**Solutions**:
- Run `cleanup.bat` to kill any hanging processes
- Start the server again with `start-claude.bat`
- Restart Claude Desktop

## Configuration

You can customize ports and hosts by editing the `.env` file:

```
# Server Configuration
WEBSOCKET_PORT=3600
WEBSOCKET_HOST=localhost
MCP_PORT=3700
MCP_HOST=localhost
```

## Architecture

This integration consists of three main components:

1. **MCP Server**: Communicates with Claude using the Model Context Protocol over stdio
2. **WebSocket Server**: Enables real-time communication between the MCP server and Figma
3. **Figma Plugin**: Executes commands in Figma sent from Claude via the WebSocket server

### Communication Flow

```
Claude Desktop <-> MCP Server <-> WebSocket Server <-> Figma Plugin
     (stdio)        (websocket)        (websocket)
```

## Available Tools

The integration provides several tools for manipulating Figma:

- `join_channel` - Connect to a specific channel for communication
- `get_document_info` - Get information about the current Figma document
- `get_selection` - Get information about the current selection
- `read_my_design` - Get detailed node information about the current selection
- `get_node_info` - Get detailed information about a specific node
- `create_rectangle` - Create a new rectangle
- `create_text` - Create a new text node
- `set_text_content` - Set the text content of a single text node
- `design_strategy` - Get best practices for working with Figma designs

## Advanced Usage

### Running Individual Components

To run the WebSocket server only:

```bash
npm run start:websocket
```

To run the MCP server only:

```bash
npm run start:mcp
```

To run both servers (HTTP mode, not for Claude):

```bash
npm run start:all
```

### Development and Debugging

For development, you can capture logs while still viewing output:

```bash
start-claude.bat | tee stdout.log 2> stderr.log
```

## License

MIT
