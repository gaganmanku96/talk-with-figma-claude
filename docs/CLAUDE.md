# Claude Talk to Figma

This project allows the Claude Desktop App to communicate with Figma using the Model Context Protocol (MCP). It's based on the [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) project by Sonny Lazuardi, adapted to work with Claude Desktop App.

## Features

- Direct communication between Claude and Figma designs
- Rich set of commands to manipulate Figma elements
- Support for reading and updating text, creating shapes, and much more
- Simplified setup process for Claude Desktop App

## Prerequisites

- [Node.js](https://nodejs.org/) (v14+)
- [Claude Desktop App](https://claude.ai/desktop) installed on your computer
- [Figma Desktop](https://www.figma.com/downloads/) app (recommended) or Figma web account

## Installation

1. Clone this repository or download and extract the ZIP file
2. Open a command prompt or terminal in the project directory
3. Install dependencies:
   ```
   npm install
   ```

## Setup

### 1. Figma Plugin Setup

1. In Figma, go to **Plugins > Development > New Plugin**
2. Choose **"Link existing plugin"** 
3. Select the `src/cursor_mcp_plugin/manifest.json` file
4. The plugin should now be available in your Figma development plugins

### 2. Starting the Servers

#### For Windows:
- Double-click on `claude-figma-connect.bat`

#### For macOS/Linux:
- Make the script executable: `chmod +x claude-figma-connect.sh`
- Run: `./claude-figma-connect.sh`

### 3. Connect Claude Desktop App

1. Open Claude Desktop App
2. Go to Settings > MCPs
3. Add a new MCP called "ClaudeTalkToFigma" with these settings:
   - Command: `node`
   - Args: `mcp-server.js`
   - Working directory: Path to this project folder
4. Enable the MCP by toggling it on

### 4. Using the Integration

1. Open Figma and run the plugin (from the Plugins > Development menu)
2. In the plugin, click "Generate Channel" and copy the channel ID
3. In Claude, send the command: `join_channel {"channelId": "PASTE_CHANNEL_ID_HERE"}`
4. You're now ready to control Figma with Claude!

## Available Tools

Claude can use a rich set of tools to interact with Figma, including:

- **Document Information**: `get_document_info`, `get_selection`, etc.
- **Element Creation**: `create_rectangle`, `create_frame`, `create_text`, etc.
- **Text Manipulation**: `scan_text_nodes`, `set_text_content`, etc.
- **Styling**: `set_fill_color`, `set_stroke_color`, `set_corner_radius`, etc.
- **Component Management**: `get_local_components`, `create_component_instance`, etc.

## Example Commands

After joining a channel, you can send commands like:

```
get_document_info
```

```
get_selection
```

```
create_rectangle {"x": 100, "y": 100, "width": 200, "height": 100, "name": "My Rectangle"}
```

```
create_text {"x": 100, "y": 300, "text": "Hello from Claude!", "fontSize": 24}
```

## Troubleshooting

- **Connection Issues**: Ensure both the WebSocket server and MCP server are running. Check the logs in the `logs` directory.
- **Plugin Not Found**: Verify that you've correctly linked the plugin in Figma Development settings.
- **Claude Not Responding**: Make sure you've selected "ClaudeTalkToFigma" in the MCPs menu.

### Server Monitor

A server monitor is available to help troubleshoot connection issues. It automatically starts when you run the system, but you can also manually start it with:

```
npm run monitor
```

Access the monitor dashboard at: http://localhost:3650

## License

MIT License - see the original project for more details.

## Acknowledgements

This project is based on [cursor-talk-to-figma-mcp](https://github.com/sonnylazuardi/cursor-talk-to-figma-mcp) by Sonny Lazuardi. It has been adapted to work with Claude Desktop App.
