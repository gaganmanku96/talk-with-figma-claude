import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getWebSocketClient } from './server';
import WebSocket from 'ws';

let activeChannelId: string | null = null;

// Set the active channel ID
export function setActiveChannelId(channelId: string) {
  activeChannelId = channelId;
}

// Get the active channel ID
export function getActiveChannelId() {
  return activeChannelId;
}

// Send a command to Figma through WebSocket
export function sendFigmaCommand(command: string, params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = getWebSocketClient();

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket is not connected'));
      return;
    }

    if (!activeChannelId) {
      reject(new Error('Not connected to a Figma channel. Use join_channel first.'));
      return;
    }

    const requestId = Date.now().toString();

    // Define message handler function
    const messageHandler = (data: WebSocket.Data) => {
      try {
        const message = data.toString();
        const parsedData = JSON.parse(message);

        // Check if this is the response to our request
        if (parsedData.type === 'figma_response' && parsedData.requestId === requestId) {
          // Remove the event listener
          ws.off('message', messageHandler);

          if (parsedData.error) {
            reject(new Error(parsedData.error));
          } else {
            resolve(parsedData.result);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Add event listener for the response
    ws.on('message', messageHandler);

    // Send the command
    ws.send(JSON.stringify({
      type: 'figma_command',
      channelId: activeChannelId,
      requestId,
      command,
      params
    }));

    // Set timeout for the request
    setTimeout(() => {
      ws.off('message', messageHandler);
      reject(new Error('Figma command timed out'));
    }, 30000);
  });
}

// Handle WebSocket messages from Figma
export function handleWebSocketMessage(message: string, mcpServer: McpServer) {
  try {
    const data = JSON.parse(message);

    if (data.type === 'channel_joined') {
      setActiveChannelId(data.channelId);
      console.log(`Joined channel: ${data.channelId}`);
    }

    // Other message types can be handled here as needed

  } catch (error) {
    console.error('Error handling WebSocket message:', error);
  }
}

