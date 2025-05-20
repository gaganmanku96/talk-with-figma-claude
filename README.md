# Talk to Figma - Claude Desktop App Integration

This project enables Claude Desktop App to control Figma through the MCP (Model Context Protocol) and WebSocket communication. It extends the original [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) to work with Claude Desktop App via stdio.



## Architecture

The project consists of three main components:

1. **WebSocket Server**: Enables real-time communication between Figma and the MCP server
2. **MCP Server**: Handles the Model Context Protocol communication with Claude
3. **Claude Bridge**: Connects Claude Desktop App's stdio interface with the MCP server

```
                  ┌──────────────┐
                  │Claude Desktop│
                  └───────┬──────┘
                          │
                          │ STDIO
                          ▼
┌─────────────────┐    ┌────────────┐    ┌─────────────┐
│Figma Plugin     │◄──►│MCP Server  │◄───┤WebSocket    │
│(in Figma)       │    │+ STDIO     │    │Server       │
│                 │    │Bridge      │    │             │
└─────────────────┘    └────────────┘    └─────────────┘
```

## Prerequisites

- Node.js 14+ and npm
- Figma desktop application with the Figma MCP plugin installed

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/gaganmanku96/talk-with-figma-claude.git
   cd talk-with-figma-claude
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Make the startup scripts executable (Linux/macOS):
   ```
   chmod +x run-figma-claude.sh
   ```

## Usage

### Quick Start

#### On Linux/macOS:
```
./bin/claude-figma-connect.sh
```

#### On Windows:
```
bin\claude-figma-connect.bat
```

This will start all necessary components:
- WebSocket server (background)
- MCP server (background)
- Claude bridge (foreground)

### Using with Claude Desktop App

1. Start the integration using one of the scripts above
2. Open Claude Desktop App
3. In Claude, use the following tool commands:
   - First use `join_channel` to establish a connection
   - Then use various Figma tools like `create_rectangle`, `get_document_info`, etc.

## Available Tools

### Basic Figma tools:
- Document information tools (`get_document_info`, `get_selection`, etc.)
- Creation tools (`create_rectangle`, `create_frame`, `create_text`, etc.)
- Styling tools (`set_fill_color`, `set_corner_radius`, etc.)
- Component tools (`create_component`, `update_instance_properties`, etc.)

### Enhanced tools:
- `enhanced_create_component_instance`: Better component instance creation
- `enhanced_set_fill_color`: Improved color handling
- `create_multiple_instances`: Batch creation of instances

## Logs

Logs are stored in the `logs` directory with timestamped files for each component.

## Monitoring

A server monitoring dashboard is available at http://localhost:3650 when the server is running.

## Troubleshooting

If you encounter issues:

1. Check the log files in the `logs` directory
2. Make sure Figma is running with the plugin installed
3. Try running the `health_check` or `connection_status` tools from Claude
4. Restart the integration if needed

## License

MIT License - See LICENSE file for details.
