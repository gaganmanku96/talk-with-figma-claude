/**
 * Figma Bridge - Helper functions for working with Figma via the MCP
 * 
 * This module provides higher-level abstractions over the basic Figma commands
 * to make it easier to work with complex designs.
 */

// Import required modules
const WebSocket = require('ws');

// Keep track of the WebSocket connection
let ws = null;
let activeChannelId = null;

/**
 * Initialize the bridge with an existing WebSocket connection
 * 
 * @param {WebSocket} webSocket - The WebSocket connection to use
 * @param {string} channelId - The active channel ID
 */
function initialize(webSocket, channelId) {
  ws = webSocket;
  activeChannelId = channelId;
  
  console.log('Figma Bridge initialized');
  return true;
}

/**
 * Send a command to Figma and wait for the response
 * 
 * @param {string} command - The command to send
 * @param {object} params - The parameters for the command
 * @returns {Promise<object>} - The response from Figma
 */
function sendCommand(command, params) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket is not connected'));
      return;
    }
    
    if (!activeChannelId) {
      reject(new Error('Not connected to a Figma channel'));
      return;
    }
    
    const requestId = Date.now().toString();
    
    // Define message handler function
    const messageHandler = (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Check if this is the response to our request
        if (message.type === 'figma_response' && message.requestId === requestId) {
          // Remove the event listener
          ws.removeListener('message', messageHandler);
          
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result);
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
      ws.removeListener('message', messageHandler);
      reject(new Error('Figma command timed out'));
    }, 30000);
  });
}

/**
 * Get the current selection and extract useful information
 * 
 * @returns {Promise<object>} - Information about the current selection
 */
async function getSelectionInfo() {
  try {
    const selection = await sendCommand('get_selection', {});
    
    if (!selection || !selection.nodes || selection.nodes.length === 0) {
      return { 
        isEmpty: true,
        message: 'No selection found. Please select something in Figma.' 
      };
    }
    
    // Get more detailed information about each selected node
    const detailedNodes = [];
    
    for (const nodeId of selection.nodes) {
      try {
        const nodeInfo = await sendCommand('get_node_info', { nodeId });
        detailedNodes.push(nodeInfo);
      } catch (error) {
        console.error(`Error getting info for node ${nodeId}:`, error);
      }
    }
    
    return {
      isEmpty: false,
      count: selection.nodes.length,
      nodes: detailedNodes,
      firstNode: detailedNodes[0] || null
    };
  } catch (error) {
    console.error('Error getting selection info:', error);
    throw error;
  }
}

/**
 * Create a basic UI component based on a description
 * 
 * @param {string} componentType - The type of component to create (button, input, card, etc.)
 * @param {object} options - Component options (position, size, text, etc.)
 * @returns {Promise<object>} - Information about the created component
 */
async function createUIComponent(componentType, options = {}) {
  const { x = 0, y = 0, width, height, text, name } = options;
  
  try {
    let result;
    
    switch (componentType.toLowerCase()) {
      case 'button': {
        // Create a frame for the button
        const frame = await sendCommand('create_frame', {
          x,
          y,
          width: width || 120,
          height: height || 40,
          name: name || 'Button'
        });
        
        // Set fill color (default blue)
        await sendCommand('set_fill_color', {
          nodeId: frame.id,
          fills: [{
            type: 'SOLID',
            color: options.color || { r: 0.2, g: 0.4, b: 0.9 },
            opacity: 1
          }]
        });
        
        // Set corner radius
        await sendCommand('set_corner_radius', {
          nodeId: frame.id,
          radius: options.cornerRadius || 4
        });
        
        // Add text
        const textNode = await sendCommand('create_text', {
          x: 0,
          y: 0,
          text: text || 'Button',
          fontSize: options.fontSize || 16,
          parentId: frame.id
        });
        
        // Center the text in the button
        // This is a simplification - would need more complex layout in a real implementation
        
        result = {
          id: frame.id,
          type: 'button',
          textId: textNode.id
        };
        break;
      }
      
      case 'input': {
        // Create a frame for the input field
        const frame = await sendCommand('create_frame', {
          x,
          y,
          width: width || 200,
          height: height || 40,
          name: name || 'Input Field'
        });
        
        // Set fill color (white background)
        await sendCommand('set_fill_color', {
          nodeId: frame.id,
          fills: [{
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1
          }]
        });
        
        // Set border
        await sendCommand('set_stroke', {
          nodeId: frame.id,
          strokes: [{
            type: 'SOLID',
            color: { r: 0.8, g: 0.8, b: 0.8 },
            opacity: 1,
            weight: 1
          }]
        });
        
        // Set corner radius
        await sendCommand('set_corner_radius', {
          nodeId: frame.id,
          radius: options.cornerRadius || 4
        });
        
        // Add placeholder text
        const textNode = await sendCommand('create_text', {
          x: 10, // Add some padding
          y: 10,
          text: text || 'Placeholder text',
          fontSize: options.fontSize || 14,
          parentId: frame.id
        });
        
        // Set placeholder text color to gray
        await sendCommand('set_fill_color', {
          nodeId: textNode.id,
          fills: [{
            type: 'SOLID',
            color: { r: 0.6, g: 0.6, b: 0.6 },
            opacity: 1
          }]
        });
        
        result = {
          id: frame.id,
          type: 'input',
          textId: textNode.id
        };
        break;
      }
      
      case 'card': {
        // Create a frame for the card
        const frame = await sendCommand('create_frame', {
          x,
          y,
          width: width || 300,
          height: height || 200,
          name: name || 'Card'
        });
        
        // Set fill color (white background)
        await sendCommand('set_fill_color', {
          nodeId: frame.id,
          fills: [{
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 },
            opacity: 1
          }]
        });
        
        // Set corner radius
        await sendCommand('set_corner_radius', {
          nodeId: frame.id,
          radius: options.cornerRadius || 8
        });
        
        // Add shadow effect
        await sendCommand('set_effects', {
          nodeId: frame.id,
          effects: [{
            type: 'DROP_SHADOW',
            visible: true,
            radius: 8,
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 4 },
            spread: 0
          }]
        });
        
        // Add title text if provided
        let titleId = null;
        if (text) {
          const textNode = await sendCommand('create_text', {
            x: 16,
            y: 16,
            text: text,
            fontSize: options.fontSize || 18,
            parentId: frame.id
          });
          titleId = textNode.id;
        }
        
        result = {
          id: frame.id,
          type: 'card',
          titleId
        };
        break;
      }
      
      default:
        throw new Error(`Unknown component type: ${componentType}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error creating ${componentType}:`, error);
    throw error;
  }
}

/**
 * Create a basic layout structure
 * 
 * @param {string} layoutType - The type of layout to create (header, sidebar, etc.)
 * @param {object} options - Layout options
 * @returns {Promise<object>} - Information about the created layout
 */
async function createLayout(layoutType, options = {}) {
  const { x = 0, y = 0, width = 1024, height = 768, name } = options;
  
  try {
    let result;
    
    switch (layoutType.toLowerCase()) {
      case 'header': {
        // Create a frame for the header
        const frame = await sendCommand('create_frame', {
          x,
          y,
          width,
          height: options.height || 64,
          name: name || 'Header'
        });
        
        // Set fill color
        await sendCommand('set_fill_color', {
          nodeId: frame.id,
          fills: [{
            type: 'SOLID',
            color: options.color || { r: 1, g: 1, b: 1 },
            opacity: 1
          }]
        });
        
        // Add logo/title
        const textNode = await sendCommand('create_text', {
          x: 16,
          y: 20,
          text: options.title || 'Logo',
          fontSize: 24,
          parentId: frame.id
        });
        
        result = {
          id: frame.id,
          type: 'header',
          titleId: textNode.id
        };
        break;
      }
      
      case 'sidebar': {
        // Create a frame for the sidebar
        const frame = await sendCommand('create_frame', {
          x,
          y,
          width: options.width || 240,
          height,
          name: name || 'Sidebar'
        });
        
        // Set fill color
        await sendCommand('set_fill_color', {
          nodeId: frame.id,
          fills: [{
            type: 'SOLID',
            color: options.color || { r: 0.95, g: 0.95, b: 0.95 },
            opacity: 1
          }]
        });
        
        result = {
          id: frame.id,
          type: 'sidebar'
        };
        
        // Add menu items if provided
        if (options.menuItems && Array.isArray(options.menuItems)) {
          const menuItemIds = [];
          
          for (let i = 0; i < options.menuItems.length; i++) {
            const itemText = options.menuItems[i];
            const textNode = await sendCommand('create_text', {
              x: 16,
              y: 20 + (i * 40),
              text: itemText,
              fontSize: 16,
              parentId: frame.id
            });
            
            menuItemIds.push(textNode.id);
          }
          
          result.menuItemIds = menuItemIds;
        }
        
        break;
      }
      
      case 'grid': {
        // Create a main frame for the grid
        const frame = await sendCommand('create_frame', {
          x,
          y,
          width,
          height,
          name: name || 'Grid Layout'
        });
        
        // Set up auto-layout
        await sendCommand('set_layout_mode', {
          nodeId: frame.id,
          layoutMode: 'HORIZONTAL',
          wrapping: 'WRAP'
        });
        
        await sendCommand('set_padding', {
          nodeId: frame.id,
          padding: {
            top: 16,
            right: 16,
            bottom: 16,
            left: 16
          }
        });
        
        await sendCommand('set_item_spacing', {
          nodeId: frame.id,
          spacing: 16
        });
        
        result = {
          id: frame.id,
          type: 'grid'
        };
        
        // Add grid items if a count is provided
        if (options.itemCount && options.itemCount > 0) {
          const itemWidth = options.itemWidth || 200;
          const itemHeight = options.itemHeight || 200;
          const itemIds = [];
          
          for (let i = 0; i < options.itemCount; i++) {
            const itemFrame = await sendCommand('create_rectangle', {
              x: 0,
              y: 0,
              width: itemWidth,
              height: itemHeight,
              name: `Grid Item ${i + 1}`,
              parentId: frame.id
            });
            
            // Set fill color
            await sendCommand('set_fill_color', {
              nodeId: itemFrame.id,
              fills: [{
                type: 'SOLID',
                color: { r: 1, g: 1, b: 1 },
                opacity: 1
              }]
            });
            
            // Set corner radius
            await sendCommand('set_corner_radius', {
              nodeId: itemFrame.id,
              radius: 4
            });
            
            itemIds.push(itemFrame.id);
          }
          
          result.itemIds = itemIds;
        }
        
        break;
      }
      
      default:
        throw new Error(`Unknown layout type: ${layoutType}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error creating ${layoutType} layout:`, error);
    throw error;
  }
}

// Export the functions
module.exports = {
  initialize,
  sendCommand,
  getSelectionInfo,
  createUIComponent,
  createLayout
};
