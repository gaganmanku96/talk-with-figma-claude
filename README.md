# Talk to Figma with Claude

A bridge application that allows Claude to communicate with Figma through the Model Context Protocol (MCP). Design and modify Figma files directly through natural language conversations with Claude.

![Claude and Figma Integration Banner](https://placeholder.for/claude-figma-banner.png)

## 🌟 Features

- Control Figma through natural language conversations with Claude
- Create, modify, and delete design elements in real-time
- Get detailed analysis of your designs
- Perform bulk operations and design transformations
- Design assistance using Claude's AI capabilities
- No deployment needed - runs locally on your machine

## 🚀 Quick Start

### Prerequisites

- [Claude Desktop](https://claude.ai/desktop) application
- [Figma Desktop](https://www.figma.com/downloads/) application
- One of the following:
  - [Docker](https://www.docker.com/products/docker-desktop/) with [Docker Compose](https://docs.docker.com/compose/install/) (recommended)
  - OR [Node.js](https://nodejs.org/) (v16 or higher)

## 🔌 Setup Guide

### Option 1: Using Docker (Recommended)

This is the easiest setup method - just pull and run the Docker image.

#### Using Docker Compose (Simplest)

1. Download the docker-compose.yml file:
   ```bash
   curl -O https://raw.githubusercontent.com/yourusername/talk-to-figma-claude/main/docker-compose.yml
   ```

2. Start the WebSocket server:
   ```bash
   docker-compose up -d
   ```

#### Using Docker CLI

1. Pull the Docker image:
   ```bash
   docker pull ghcr.io/yourusername/talk-to-figma-claude:latest
   ```

2. Run the container:
   ```bash
   docker run -d -p 3600:3600 --name talk-to-figma ghcr.io/yourusername/talk-to-figma-claude:latest
   ```

3. Configure Claude Desktop (see below)

### Option 2: Manual Setup

If you prefer not to use Docker:

1. Clone this repository
   ```bash
   git clone https://github.com/yourusername/talk-to-figma-claude.git
   cd talk-to-figma-claude
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the WebSocket server
   ```bash
   node websocket-server.js
   ```

### Setting Up Claude Desktop

1. Open Claude Desktop
2. Go to Settings → Developer
3. Click "Edit Config"
4. Add one of the following configurations:

   **For Docker setup:**
   ```json
   {
     "mcpServers": {
       "TalkToFigma": {
         "command": "docker",
         "args": [
           "run",
           "--rm",
           "-i",
           "ghcr.io/yourusername/talk-to-figma-claude:mcp"
         ],
         "env": {}
       }
     }
   }
   ```

   **For manual setup:**
   ```json
   {
     "mcpServers": {
       "TalkToFigma": {
         "command": "node",
         "args": [
           "<FULL_PATH_TO_PROJECT>/mcp-server.js"
         ],
         "env": {}
       }
     }
   }
   ```
   Replace `<FULL_PATH_TO_PROJECT>` with the absolute path to your project directory.

5. Save and restart Claude Desktop

### Setting Up the Figma Plugin

1. Open Figma Desktop app
2. Go to Plugins → Development → Import plugin from manifest...
3. Navigate to the `src/figma_plugin` directory in this project
4. Select the manifest.json file

## 🎮 How to Use

1. Make sure the WebSocket server is running (either directly or via Docker)
2. Open Figma and your design file
3. Run the Talk to Figma plugin in Figma
4. Connect the plugin to the WebSocket server
5. Open Claude Desktop and select "TalkToFigma" from the MCP dropdown
6. Join the Figma channel by telling Claude:
   ```
   Please join the Figma channel with ID: [ID from plugin]
   ```
7. Start designing with Claude:
   ```
   Create a rectangle at position x=100, y=200 with width=300 and height=150
   ```

![Demo of Claude controlling Figma](https://placeholder.for/claude-figma-demo.gif)

## 📋 Example Commands

Here are some examples of what you can ask Claude to do:

- **Get document information**:  
  "What's in my current Figma document?"

- **Create design elements**:  
  "Create a blue rectangle with rounded corners at x=200, y=150"

- **Modify elements**:  
  "Change the text in the selected element to 'Welcome to our platform'"

- **Work with components**:  
  "Create an instance of the Button component"

- **Export assets**:  
  "Export the logo as a PNG"

See the [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) file for more detailed examples.

## 🎨 Advanced Figma Operations

The integration supports advanced Figma operations, including:

### Setting Fill Colors
```
Set the fill color of the rectangle to a purple gradient from top to bottom
```

This allows for solid colors, gradients, and other fill types.

### Creating Component Instances
```
Create an instance of the Button component at x=50, y=200 and set its label to "Submit"
```

### Working with Variables
```
Create a color variable called "primary-color" with the value #6B2BE0
```

### Creating Design Systems
```
Create a text input component with rounded corners and a white background
```

### Batch Operations
```
Create 6 instances of the OTP Box component in a row, spaced 60px apart
```

For developers, check out [examples/tool-examples.js](examples/tool-examples.js) which contains programmatic examples of these advanced operations.

## 🔧 Technical Architecture

The integration consists of three main components:

1. **MCP Server**: Handles communication with Claude Desktop through direct execution (stdio mode)
2. **WebSocket Server**: Manages communication with the Figma plugin
3. **Figma Plugin**: Runs inside Figma and executes commands from Claude

The architecture works as follows:
- Claude Desktop directly executes the MCP server script (or Docker container)
- The MCP server communicates with Claude through standard input/output streams
- The MCP server connects to the WebSocket server
- The Figma plugin connects to the WebSocket server
- Commands flow from Claude → MCP Server → WebSocket Server → Figma Plugin → Figma

![Architecture Diagram](https://placeholder.for/architecture-diagram.png)

## 🐳 Docker Images

The project provides two Docker images:

1. **WebSocket Server Image** (`ghcr.io/yourusername/talk-to-figma-claude:latest`)
   - Runs the WebSocket server
   - Needs to be running continuously

2. **MCP Server Image** (`ghcr.io/yourusername/talk-to-figma-claude:mcp`)
   - Used directly by Claude Desktop
   - Automatically started when needed

These images are hosted on GitHub Container Registry for easy access.

## 🛠️ Troubleshooting

If you encounter any issues:

1. Check that the WebSocket server is running (Docker container or Node.js)
2. Verify Claude Desktop configuration is correct
3. Ensure the Figma plugin is connected to the WebSocket server
4. Check Docker logs if using Docker:
   ```bash
   docker logs talk-to-figma
   ```

For more detailed troubleshooting, see [SETUP.md](SETUP.md).

## 📝 Notes

- This project does not require deployment to a server
- All communication happens locally between Claude Desktop and Figma
- The MCP server is started automatically by Claude Desktop
- Only the WebSocket server needs to be started manually (or via Docker)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
