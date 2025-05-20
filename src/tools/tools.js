// The functions will be set later to avoid circular dependencies
let sendFigmaCommand;
let getActiveChannelId;
let setActiveChannelId;
let getWebSocketClient;
const WebSocket = require('ws');

// Define the MCP tools
const tools = {
  // Connection status tools
  connection_status: {
    description: 'Get the current connection status to check if everything is working correctly',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      const ws = getWebSocketClient();
      
      // Check WebSocket connection
      let wsStatus = 'disconnected';
      let wsDetails = {};
      
      if (ws) {
        switch(ws.readyState) {
          case WebSocket.CONNECTING:
            wsStatus = 'connecting';
            break;
          case WebSocket.OPEN:
            wsStatus = 'connected';
            break;
          case WebSocket.CLOSING:
            wsStatus = 'closing';
            break;
          case WebSocket.CLOSED:
            wsStatus = 'disconnected';
            break;
        }
        
        wsDetails = {
          readyState: ws.readyState,
          protocol: ws.protocol,
          bufferedAmount: ws.bufferedAmount
        };
      }
      
      // Check active channel status
      const activeChannelId = getActiveChannelId();
      
      // Check Figma connection by sending a ping
      let figmaConnected = false;
      if (wsStatus === 'connected' && activeChannelId) {
        try {
          // Try a simple command to check if Figma is responding
          await sendFigmaCommand('get_document_info', {}).catch(() => {});
          figmaConnected = true;
        } catch (e) {
          // If there's an error, Figma is probably not connected
          figmaConnected = false;
        }
      }
      
      return {
        status: {
          websocket: wsStatus,
          activeChannel: activeChannelId ? 'joined' : 'not joined',
          figma: figmaConnected ? 'connected' : 'disconnected'
        },
        details: {
          websocket: wsDetails,
          activeChannelId,
          timestamp: new Date().toISOString()
        },
        message: wsStatus === 'connected' 
          ? (activeChannelId 
              ? (figmaConnected 
                  ? 'Everything is working correctly.'
                  : 'Connected to WebSocket server and channel, but Figma is not responding. Make sure the Figma plugin is running and joined to the same channel.') 
              : 'Connected to WebSocket server but not joined to a channel. Use join_channel first.')
          : 'Not connected to WebSocket server. Please restart the server and try again.'
      };
    }
  },
  // Connection tools
  join_channel: {
    description: 'Join a specific channel to communicate with Figma',
    parameters: {
      type: 'object',
      properties: {
        channelId: {
          type: 'string',
          description: 'Optional channel ID to join. If not provided, a new channel will be created.'
        }
      }
    },
    handler: async ({ channelId }) => {
      const ws = getWebSocketClient();
      
      if (!ws) {
        return { 
          message: 'WebSocket is not connected. Attempting to automatically reconnect...',
          status: 'error',
          action: 'Please try again in a few seconds.'
        };
      }
      
      if (ws.readyState !== WebSocket.OPEN) {
        return {
          message: `WebSocket is in ${ws.readyState === WebSocket.CONNECTING ? 'connecting' : 'closing'} state. Please wait a moment and try again.`,
          status: 'pending',
          action: 'Please try again in a few seconds.'
        };
      }
      
      try {
        ws.send(JSON.stringify({
          type: 'join_channel',
          channelId
        }));
        
        // Set a timeout to wait for the channel_joined message
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout waiting for channel join confirmation')), 5000);
        });
        
        // Create a promise that resolves when we join the channel
        const joinPromise = new Promise((resolve) => {
          const messageHandler = (data) => {
            try {
              const message = JSON.parse(data.toString());
              if (message.type === 'channel_joined') {
                // Remove the listener once we get the confirmation
                ws.removeListener('message', messageHandler);
                resolve(message.channelId);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          };
          
          // Add the listener
          ws.on('message', messageHandler);
          
          // Make sure to clean up if there's an error
          timeoutPromise.catch(() => {
            ws.removeListener('message', messageHandler);
          });
        });
        
        // Race the join promise against the timeout
        try {
          const joinedChannelId = await Promise.race([joinPromise, timeoutPromise]);
          return { 
            message: `Successfully joined channel: ${joinedChannelId}`,
            status: 'success',
            channelId: joinedChannelId,
            tip: 'Make sure to also run the Figma plugin and join the same channel'
          };
        } catch (e) {
          // If we timeout, still return a pending message
          return { 
            message: channelId 
              ? `Sent request to join channel: ${channelId}. Waiting for confirmation...` 
              : 'Creating a new channel. Waiting for confirmation...',
            status: 'pending',
            tip: 'Make sure to also run the Figma plugin and join the same channel'
          };
        }
      } catch (error) {
        return {
          message: `Error joining channel: ${error.message}`,
          status: 'error',
          error: error.message
        };
      }
    }
  },
  
  // Document information tools
  get_document_info: {
    description: 'Get information about the current Figma document',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('get_document_info', {});
    }
  },
  
  get_selection: {
    description: 'Get information about the current selection in Figma',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('get_selection', {});
    }
  },
  
  read_my_design: {
    description: 'Get detailed node information about the current selection without parameters',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('read_my_design', {});
    }
  },
  
  get_node_info: {
    description: 'Get detailed information about a specific node',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to get information about'
        }
      },
      required: ['nodeId']
    },
    handler: async ({ nodeId }) => {
      return await sendFigmaCommand('get_node_info', { nodeId });
    }
  },
  
  // Creation tools
  create_rectangle: {
    description: 'Create a new rectangle with position, size, and optional name',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'The x position of the rectangle'
        },
        y: {
          type: 'number',
          description: 'The y position of the rectangle'
        },
        width: {
          type: 'number',
          description: 'The width of the rectangle'
        },
        height: {
          type: 'number',
          description: 'The height of the rectangle'
        },
        name: {
          type: 'string',
          description: 'Optional name for the rectangle'
        },
        parentId: {
          type: 'string',
          description: 'Optional parent node ID'
        }
      },
      required: ['x', 'y', 'width', 'height']
    },
    handler: async (params) => {
      return await sendFigmaCommand('create_rectangle', params);
    }
  },
  
  create_frame: {
    description: 'Create a new frame that can contain other elements',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'The x position of the frame'
        },
        y: {
          type: 'number',
          description: 'The y position of the frame'
        },
        width: {
          type: 'number',
          description: 'The width of the frame'
        },
        height: {
          type: 'number',
          description: 'The height of the frame'
        },
        name: {
          type: 'string',
          description: 'Optional name for the frame'
        },
        parentId: {
          type: 'string',
          description: 'Optional parent node ID'
        }
      },
      required: ['x', 'y', 'width', 'height']
    },
    handler: async (params) => {
      return await sendFigmaCommand('create_frame', params);
    }
  },
  
  create_text: {
    description: 'Create a new text node with customizable font properties',
    parameters: {
      type: 'object',
      properties: {
        x: {
          type: 'number',
          description: 'The x position of the text node'
        },
        y: {
          type: 'number',
          description: 'The y position of the text node'
        },
        text: {
          type: 'string',
          description: 'The text content'
        },
        fontSize: {
          type: 'number',
          description: 'The font size in pixels'
        },
        fontName: {
          type: 'object',
          properties: {
            family: {
              type: 'string',
              description: 'The font family name'
            },
            style: {
              type: 'string',
              description: 'The font style (e.g., "Regular", "Bold")'
            }
          },
          description: 'The font to use'
        },
        name: {
          type: 'string',
          description: 'Optional name for the text node'
        },
        parentId: {
          type: 'string',
          description: 'Optional parent node ID'
        }
      },
      required: ['x', 'y', 'text']
    },
    handler: async (params) => {
      return await sendFigmaCommand('create_text', params);
    }
  },
  
  // Text tools
  set_text_content: {
    description: 'Set the text content of a single text node',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the text node'
        },
        text: {
          type: 'string',
          description: 'The new text content'
        }
      },
      required: ['nodeId', 'text']
    },
    handler: async ({ nodeId, text }) => {
      return await sendFigmaCommand('set_text_content', { nodeId, text });
    }
  },
  
  // Styling tools
  set_fill_color: {
    description: 'Set fill color with support for gradients, multiple fills, and backwards compatibility',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to style'
        },
        // New format: array of fills
        fills: {
          type: 'array',
          description: 'Array of fill objects',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['SOLID', 'LINEAR_GRADIENT', 'RADIAL_GRADIENT'],
                description: 'Type of fill'
              },
              color: {
                type: 'object',
                properties: {
                  r: { type: 'number', description: 'Red value (0-1)' },
                  g: { type: 'number', description: 'Green value (0-1)' },
                  b: { type: 'number', description: 'Blue value (0-1)' }
                },
                description: 'Color for solid fills'
              },
              opacity: {
                type: 'number',
                description: 'Opacity (0-1)'
              },
              gradientStops: {
                type: 'array',
                description: 'Gradient stops for gradient fills',
                items: {
                  type: 'object',
                  properties: {
                    position: { type: 'number', description: 'Position (0-1)' },
                    color: {
                      type: 'object',
                      properties: {
                        r: { type: 'number', description: 'Red value (0-1)' },
                        g: { type: 'number', description: 'Green value (0-1)' },
                        b: { type: 'number', description: 'Blue value (0-1)' },
                        a: { type: 'number', description: 'Alpha value (0-1), defaults to 1' }
                      },
                      required: ['r', 'g', 'b']
                    }
                  },
                  required: ['position', 'color']
                }
              },
              gradientTransform: {
                type: 'array',
                description: 'Gradient transform matrix [[1,0,0],[0,1,0]] for direction',
                items: {
                  type: 'array',
                  items: { type: 'number' }
                }
              }
            }
          }
        },
        // Backward compatibility with old RGBA format
        r: {
          type: 'number',
          description: 'Red component (0-1) - deprecated, use fills array instead'
        },
        g: {
          type: 'number',
          description: 'Green component (0-1) - deprecated, use fills array instead'
        },
        b: {
          type: 'number',
          description: 'Blue component (0-1) - deprecated, use fills array instead'
        },
        a: {
          type: 'number',
          description: 'Alpha component (0-1) - deprecated, use fills array instead'
        }
      },
      required: ['nodeId']
    },
    handler: async ({ nodeId, fills, r, g, b, a }) => {
      // Handle backward compatibility
      if (!fills && (r !== undefined || g !== undefined || b !== undefined)) {
        fills = [{
          type: 'SOLID',
          color: {
            r: r || 0,
            g: g || 0,
            b: b || 0
          },
          opacity: a !== undefined ? a : 1
        }];
      }
      
      return await sendFigmaCommand('set_fill_color', { nodeId, fills });
    }
  },
  
  set_corner_radius: {
    description: 'Set corner radius for rectangles and frames',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to modify'
        },
        radius: {
          type: ['number', 'object'],
          description: 'Uniform radius (number) or individual corners (object)',
          properties: {
            topLeft: { type: 'number', description: 'Top left corner radius' },
            topRight: { type: 'number', description: 'Top right corner radius' },
            bottomRight: { type: 'number', description: 'Bottom right corner radius' },
            bottomLeft: { type: 'number', description: 'Bottom left corner radius' }
          }
        }
      },
      required: ['nodeId', 'radius']
    },
    handler: async ({ nodeId, radius }) => {
      return await sendFigmaCommand('set_corner_radius', { nodeId, radius });
    }
  },
  
  set_stroke: {
    description: 'Set stroke properties including color, width, and style',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to modify'
        },
        strokes: {
          type: 'array',
          description: 'Array of stroke objects',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['SOLID', 'GRADIENT'],
                description: 'Type of stroke'
              },
              color: {
                type: 'object',
                properties: {
                  r: { type: 'number', description: 'Red value (0-1)' },
                  g: { type: 'number', description: 'Green value (0-1)' },
                  b: { type: 'number', description: 'Blue value (0-1)' }
                },
                description: 'Color for solid strokes'
              },
              opacity: {
                type: 'number',
                description: 'Opacity (0-1)'
              },
              weight: {
                type: 'number',
                description: 'Stroke width in pixels'
              },
              strokeAlign: {
                type: 'string',
                enum: ['INSIDE', 'OUTSIDE', 'CENTER'],
                description: 'Stroke alignment'
              },
              dashPattern: {
                type: 'array',
                description: 'Dash pattern for dashed lines',
                items: { type: 'number' }
              },
              strokeCap: {
                type: 'string',
                enum: ['NONE', 'ROUND', 'SQUARE'],
                description: 'Stroke cap style'
              },
              strokeJoin: {
                type: 'string',
                enum: ['MITER', 'ROUND', 'BEVEL'],
                description: 'Stroke join style'
              }
            }
          }
        }
      },
      required: ['nodeId', 'strokes']
    },
    handler: async ({ nodeId, strokes }) => {
      return await sendFigmaCommand('set_stroke', { nodeId, strokes });
    }
  },
  
  set_effects: {
    description: 'Add effects like shadows, blurs, and glows',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to modify'
        },
        effects: {
          type: 'array',
          description: 'Array of effect objects',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['DROP_SHADOW', 'INNER_SHADOW', 'LAYER_BLUR', 'BACKGROUND_BLUR'],
                description: 'Type of effect'
              },
              visible: {
                type: 'boolean',
                description: 'Whether the effect is visible'
              },
              radius: {
                type: 'number',
                description: 'Blur radius'
              },
              color: {
                type: 'object',
                properties: {
                  r: { type: 'number', description: 'Red value (0-1)' },
                  g: { type: 'number', description: 'Green value (0-1)' },
                  b: { type: 'number', description: 'Blue value (0-1)' },
                  a: { type: 'number', description: 'Alpha value (0-1)' }
                },
                description: 'Color for shadow effects'
              },
              offset: {
                type: 'object',
                properties: {
                  x: { type: 'number', description: 'X offset' },
                  y: { type: 'number', description: 'Y offset' }
                },
                description: 'Offset for shadow effects'
              },
              spread: {
                type: 'number',
                description: 'Spread for shadow effects'
              },
              blurType: {
                type: 'string',
                enum: ['LAYER', 'BACKGROUND'],
                description: 'Blur type for blur effects'
              }
            }
          }
        }
      },
      required: ['nodeId', 'effects']
    },
    handler: async ({ nodeId, effects }) => {
      return await sendFigmaCommand('set_effects', { nodeId, effects });
    }
  },
  
  // Image tools
  create_image_from_url: {
    description: 'Creates an image in Figma from a URL (supports PNG, JPG, GIF up to 4096x4096px)',
    parameters: {
      type: 'object',
      properties: {
        imageUrl: {
          type: 'string',
          description: 'URL of the image to add'
        },
        x: {
          type: 'number',
          description: 'X position of the image'
        },
        y: {
          type: 'number',
          description: 'Y position of the image'
        },
        width: {
          type: 'number',
          description: 'Width of the image'
        },
        height: {
          type: 'number',
          description: 'Height of the image'
        },
        name: {
          type: 'string',
          description: 'Optional name for the image node'
        },
        parentId: {
          type: 'string',
          description: 'Optional parent node ID'
        }
      },
      required: ['imageUrl', 'x', 'y', 'width', 'height']
    },
    handler: async ({ imageUrl, x, y, width, height, name, parentId }) => {
      return await sendFigmaCommand('create_image_from_url', { imageUrl, x, y, width, height, name, parentId });
    }
  },
  
  set_image_fill: {
    description: 'Sets an image as a fill on a rectangle or frame',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID of the node to apply image fill'
        },
        imageUrl: {
          type: 'string',
          description: 'URL of the image'
        },
        scaleMode: {
          type: 'string',
          enum: ['FILL', 'FIT', 'CROP', 'TILE'],
          description: 'How the image should scale',
          default: 'FILL'
        }
      },
      required: ['nodeId', 'imageUrl']
    },
    handler: async ({ nodeId, imageUrl, scaleMode = 'FILL' }) => {
      return await sendFigmaCommand('set_image_fill', { nodeId, imageUrl, scaleMode });
    }
  },
  
  // Strategy tools
  design_strategy: {
    description: 'Best practices for working with Figma designs',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        strategy: `
# Figma Design Strategy

## Initial Assessment
1. Use get_document_info to understand the document structure
2. Use get_selection to examine the current user selection
3. Review the design system elements (components, styles)

## Design Creation
1. Create parent frames first
2. Add child elements within frames
3. Use components for consistent elements
4. Set styles based on the design system

## Text and Content
1. Use scan_text_nodes to inventory text elements
2. Update text with set_multiple_text_contents for bulk changes
3. Maintain font styles from the design system

## Component Usage
1. Use get_local_components to see available components
2. Create instances with create_component_instance
3. Position instances precisely
4. Apply overrides as needed

## Validation
1. Review the final design for consistency and alignment with design system
2. Check text for proper formatting and readability
3. Ensure components are properly instantiated and overrides applied correctly
4. Verify layout responsiveness
`
      };
    }
  },
  
  ui_design_guidelines: {
    description: 'Comprehensive UI/UX design guidelines and best practices',
    parameters: {
      type: 'object',
      properties: {
        section: {
          type: 'string',
          description: 'Specific section to retrieve (optional)',
          enum: [
            'core_principles',
            'ui_patterns',
            'components',
            'industry_patterns',
            'color_usage',
            'spacing_layout',
            'breakpoints',
            'accessibility',
            'checklist',
            'all'
          ]
        }
      }
    },
    handler: async ({ section = 'all' }) => {
      const guidelines = {
        core_principles: `
# Core Design Principles

- **Visual Hierarchy:** Guide user attention using size, color, and spacing
- **Consistency:** Uniform spacing, colors, typography across the design
- **Accessibility:** WCAG guidelines, contrast ratios, keyboard navigation
- **Responsive Design:** Mobile-first approach
- **Grid Systems:** 8px base unit, 12/16 column grids
`,
        ui_patterns: `
# Common UI Patterns Library

## Navigation:
- **Top Nav Bar:** Logo left, menu right
- **Bottom Tab Bar:** 3-5 items max
- **Hamburger Menu:** For mobile secondary nav
- **Breadcrumbs:** For deep navigation

## Forms:
- Label above input field
- Placeholder text for hints only
- Error messages below fields
- Required field indicators (*)
- Prominent submit buttons

## Cards:
- Image, title, description, action
- Consistent border radius
- Subtle shadows for elevation
`,
        components: `
# Component Specifications

## Buttons:
- Primary: Filled, high contrast
- Secondary: Outlined or ghost
- Minimum size: 44x44px (mobile)
- States: Default, hover, active, disabled

## Input Fields:
- Height: 48-56px
- Border: 1-2px
- Focus state with color change
- Clear error/success states

## Typography:
- H1: 32-48px
- H2: 24-32px
- Body: 16px
- Caption: 12-14px
- Line height: 1.5 for body text
`,
        industry_patterns: `
# Industry-Specific Patterns

## E-commerce:
- Product grid layout
- Shopping cart icon
- Price prominence
- Quick add to cart

## Food Delivery:
- Category cards with visuals
- Restaurant cards with ratings
- Order tracking UI
- Menu item layouts

## Banking:
- Security indicators
- Transaction lists
- Account balance display
- Secure transfer forms
`,
        color_usage: `
# Color Psychology & Usage

- **Red:** Urgency, errors, food apps
- **Blue:** Trust, finance, healthcare
- **Green:** Success, growth, eco-friendly
- **Orange:** Energy, CTAs, food
- **Purple:** Premium, creative
- **Neutral grays:** Backgrounds, borders
`,
        spacing_layout: `
# Spacing & Layout Rules

- Base unit: 8px
- Small spacing: 8px
- Medium spacing: 16px
- Large spacing: 24px
- Section spacing: 48px+
- Consistent padding in containers
`,
        breakpoints: `
# Mobile-First Breakpoints

- Mobile: 320-768px
- Tablet: 768-1024px
- Desktop: 1024px+
- Max content width: 1200-1400px
`,
        accessibility: `
# Accessibility Guidelines

- Contrast ratio: 4.5:1 for normal text
- Touch targets: Minimum 44x44px
- Focus indicators: Visible keyboard navigation
- Alt text for images
- Semantic HTML structure
`,
        checklist: `
# Initial Design Checklist

1. Grid Adherence: 8px grid system?
2. Touch Target Size: 44x44px minimum?
3. Border Radius: Consistent (4px, 8px, 12px)?
4. Elevation: Follows shadow system?
5. Platform Awareness: iOS/Android appropriate?
6. Accessibility: Contrast checked?
`
      };
      
      if (section === 'all') {
        return {
          guidelines: Object.values(guidelines).join('\n---\n')
        };
      }
      
      return {
        guidelines: guidelines[section] || 'Section not found'
      };
    }
  },
  
  // Health check and troubleshooting tools
  health_check: {
    description: 'Run a health check to diagnose potential connection issues and provide solutions',
    parameters: {
      type: 'object',
      properties: {
        includeDetails: {
          type: 'boolean',
          description: 'Include detailed technical information in the response'
        }
      }
    },
    handler: async ({ includeDetails }) => {
      const issues = [];
      const solutions = [];
      const details = {};
      
      // Check WebSocket connection
      const ws = getWebSocketClient();
      let wsConnected = false;
      
      if (!ws) {
        issues.push('WebSocket client is not initialized');
        solutions.push('Restart the MCP server by closing and reopening Claude');
      } else {
        details.websocketState = ws.readyState;
        
        if (ws.readyState === WebSocket.CONNECTING) {
          issues.push('WebSocket is still trying to connect');
          solutions.push('Wait a few seconds and try again');
        } else if (ws.readyState === WebSocket.CLOSING) {
          issues.push('WebSocket connection is closing');
          solutions.push('Wait for the connection to fully close and try again');
        } else if (ws.readyState === WebSocket.CLOSED) {
          issues.push('WebSocket connection is closed');
          solutions.push('Restart the server and try again');
        } else if (ws.readyState === WebSocket.OPEN) {
          wsConnected = true;
          // WebSocket is connected, continue with checks
        }
      }
      
      // Check channel status
      const activeChannelId = getActiveChannelId();
      details.activeChannelId = activeChannelId;
      
      if (wsConnected && !activeChannelId) {
        issues.push('Not connected to a Figma channel');
        solutions.push('Use join_channel to connect to a specific channel');
      }
      
      // If connected to WebSocket and have an active channel, try to communicate with Figma
      if (wsConnected && activeChannelId) {
        try {
          // Send a ping to Figma plugin
          const pingMessage = {
            type: 'ping',
            channelId: activeChannelId,
            timestamp: Date.now()
          };
          
          ws.send(JSON.stringify(pingMessage));
          details.pingTimestamp = pingMessage.timestamp;
          
          // We can't easily wait for the pong, but at least we tried
        } catch (error) {
          issues.push(`Error sending ping to Figma: ${error.message}`);
          solutions.push('Check if the Figma plugin is running and connected to the same channel');
          details.pingError = error.message;
        }
        
        // Try to get document info
        try {
          const result = await Promise.race([
            sendFigmaCommand('get_document_info', {}),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]);
          
          details.documentInfo = 'Request successful';
        } catch (error) {
          issues.push(`Cannot communicate with Figma: ${error.message}`);
          solutions.push('Make sure the Figma plugin is running and connected to the same channel');
          details.documentInfoError = error.message;
        }
      }
      
      // Generate status report
      let status = 'healthy';
      if (issues.length > 0) {
        status = issues.length > 2 ? 'critical' : 'warning';
      }
      
      const response = {
        status,
        summary: status === 'healthy' 
          ? 'All systems operational' 
          : `Found ${issues.length} issue(s) that may affect functionality`,
        issues,
        solutions
      };
      
      if (includeDetails) {
        response.details = details;
      }
      
      return response;
    }
  },
  
  delete_node: {
    description: 'Delete a node and all its children from the document',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to delete'
        },
        safeMode: {
          type: 'boolean',
          description: 'When true, prevents deletion of pages or document root',
          default: true
        }
      },
      required: ['nodeId']
    },
    handler: async ({ nodeId, safeMode = true }) => {
      return await sendFigmaCommand('delete_node', { nodeId, safeMode });
    }
  },
  
  reconnect: {
    description: 'Attempt to reconnect the WebSocket to fix connection issues',
    parameters: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force reconnection even if the WebSocket appears to be working'
        }
      }
    },
    handler: async ({ force }) => {
      const ws = getWebSocketClient();
      const previousChannelId = getActiveChannelId();
      
      // Check if reconnection is needed
      if (!force && ws && ws.readyState === WebSocket.OPEN) {
        return {
          success: false,
          message: 'WebSocket is already connected. Use force:true to reconnect anyway.',
          previousState: 'connected'
        };
      }
      
      // Close existing connection if it exists
      if (ws) {
        try {
          ws.close();
        } catch (e) {
          // Ignore errors when closing
        }
      }
      
      // Try to connect WebSocket server
      try {
        const newWs = new WebSocket(`ws://${process.env.WEBSOCKET_HOST || 'localhost'}:${process.env.WEBSOCKET_PORT || 3600}`);
        
        // Return a promise that resolves when connection is established
        return await new Promise((resolve, reject) => {
          // Set a timeout
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout'));
          }, 5000);
          
          newWs.on('open', () => {
            clearTimeout(timeout);
            
            // Reconnect to previous channel if it exists
            if (previousChannelId) {
              newWs.send(JSON.stringify({
                type: 'join_channel',
                channelId: previousChannelId
              }));
            }
            
            resolve({
              success: true,
              message: 'Successfully reconnected to WebSocket server',
              channelStatus: previousChannelId 
                ? `Attempting to rejoin channel: ${previousChannelId}` 
                : 'No previous channel to rejoin'
            });
          });
          
          newWs.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`WebSocket connection error: ${error.message}`));
          });
        });
      } catch (error) {
        return {
          success: false,
          message: `Failed to reconnect: ${error.message}`,
          error: error.message
        };
      }
    }
  },
  
  // Variable creation and management tools
  create_variable_collection: {
    description: 'Create a new variable collection for design tokens',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the variable collection'
        },
        modes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of mode names (e.g., ["Light", "Dark"]), defaults to ["Default"]'
        }
      },
      required: ['name']
    },
    handler: async ({ name, modes = ['Default'] }) => {
      return await sendFigmaCommand('create_variable_collection', { name, modes });
    }
  },
  
  create_variable: {
    description: 'Create a new variable (design token)',
    parameters: {
      type: 'object',
      properties: {
        collectionId: {
          type: 'string',
          description: 'ID of the variable collection'
        },
        name: {
          type: 'string',
          description: 'Name of the variable'
        },
        type: {
          type: 'string',
          enum: ['COLOR', 'NUMBER', 'STRING', 'BOOLEAN'],
          description: 'Type of the variable'
        },
        value: {
          description: 'Initial value for the variable (type depends on variable type)'
        }
      },
      required: ['collectionId', 'name', 'type']
    },
    handler: async ({ collectionId, name, type, value }) => {
      return await sendFigmaCommand('create_variable', { collectionId, name, type, value });
    }
  },
  
  set_variable_mode_value: {
    description: 'Set a variable value for a specific mode',
    parameters: {
      type: 'object',
      properties: {
        variableId: {
          type: 'string',
          description: 'ID of the variable'
        },
        modeId: {
          type: 'string',
          description: 'ID of the mode'
        },
        value: {
          description: 'Value to set (can be direct value or alias to another variable)'
        }
      },
      required: ['variableId', 'modeId', 'value']
    },
    handler: async ({ variableId, modeId, value }) => {
      return await sendFigmaCommand('set_variable_mode_value', { variableId, modeId, value });
    }
  },
  
  get_all_variable_collections: {
    description: 'Get all variable collections in the current file',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('get_all_variable_collections', {});
    }
  },
  
  get_variables_by_collection: {
    description: 'Get all variables in a specific collection',
    parameters: {
      type: 'object',
      properties: {
        collectionId: {
          type: 'string',
          description: 'ID of the variable collection'
        }
      },
      required: ['collectionId']
    },
    handler: async ({ collectionId }) => {
      return await sendFigmaCommand('get_variables_by_collection', { collectionId });
    }
  },
  
  import_variables_from_json: {
    description: 'Import variables from JSON data',
    parameters: {
      type: 'object',
      properties: {
        jsonData: {
          type: 'string',
          description: 'JSON string containing variable collections and their variables'
        }
      },
      required: ['jsonData']
    },
    handler: async ({ jsonData }) => {
      return await sendFigmaCommand('import_variables_from_json', { jsonData });
    }
  },
  
  export_variables_to_json: {
    description: 'Export all variables to JSON format',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('export_variables_to_json', {});
    }
  },
  
  create_design_tokens: {
    description: 'Create a basic design token structure with primitive and semantic tokens',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('create_design_tokens', {});
    }
  },
  
  // Component creation and management tools
  create_component: {
    description: 'Create a new component',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the component'
        },
        width: {
          type: 'number',
          description: 'Width of the component'
        },
        height: {
          type: 'number',
          description: 'Height of the component'
        },
        x: {
          type: 'number',
          description: 'X position of the component'
        },
        y: {
          type: 'number',
          description: 'Y position of the component'
        }
      },
      required: ['name', 'width', 'height']
    },
    handler: async ({ name, width, height, x = 0, y = 0 }) => {
      return await sendFigmaCommand('create_component', { name, width, height, x, y });
    }
  },
  
  create_component_from_node: {
    description: 'Convert an existing frame or group into a component',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID of the node to convert to component'
        }
      },
      required: ['nodeId']
    },
    handler: async ({ nodeId }) => {
      return await sendFigmaCommand('create_component_from_node', { nodeId });
    }
  },
  
  add_component_property: {
    description: 'Add a property to a component',
    parameters: {
      type: 'object',
      properties: {
        componentId: {
          type: 'string',
          description: 'ID of the component'
        },
        propertyName: {
          type: 'string',
          description: 'Name of the property'
        },
        propertyType: {
          type: 'string',
          enum: ['TEXT', 'BOOLEAN', 'INSTANCE_SWAP', 'VARIANT'],
          description: 'Type of the property'
        },
        defaultValue: {
          description: 'Default value for the property'
        }
      },
      required: ['componentId', 'propertyName', 'propertyType']
    },
    handler: async ({ componentId, propertyName, propertyType, defaultValue }) => {
      return await sendFigmaCommand('add_component_property', { componentId, propertyName, propertyType, defaultValue });
    }
  },
  
  create_component_set: {
    description: 'Create a component set (variants) from multiple components',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the component set'
        },
        variants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the variant'
              },
              properties: {
                type: 'object',
                description: 'Properties and values for this variant'
              }
            }
          },
          description: 'Array of variant definitions'
        }
      },
      required: ['name', 'variants']
    },
    handler: async ({ name, variants }) => {
      return await sendFigmaCommand('create_component_set', { name, variants });
    }
  },
  
  import_component_from_library: {
    description: 'Import a component from a team library',
    parameters: {
      type: 'object',
      properties: {
        componentKey: {
          type: 'string',
          description: 'Key of the component in the library'
        }
      },
      required: ['componentKey']
    },
    handler: async ({ componentKey }) => {
      return await sendFigmaCommand('import_component_from_library', { componentKey });
    }
  },
  
  update_instance_properties: {
    description: 'Update properties on a component instance',
    parameters: {
      type: 'object',
      properties: {
        instanceId: {
          type: 'string',
          description: 'ID of the component instance'
        },
        properties: {
          type: 'object',
          description: 'Properties to update with their new values'
        }
      },
      required: ['instanceId', 'properties']
    },
    handler: async ({ instanceId, properties }) => {
      return await sendFigmaCommand('update_instance_properties', { instanceId, properties });
    }
  },
  
  create_button_component: {
    description: 'Create a button component with states and properties',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the button component',
          default: 'Button'
        },
        size: {
          type: 'string',
          enum: ['small', 'medium', 'large'],
          description: 'Size of the button',
          default: 'medium'
        }
      }
    },
    handler: async ({ name = 'Button', size = 'medium' }) => {
      return await sendFigmaCommand('create_button_component', { name, size });
    }
  },
  
  create_design_system_components: {
    description: 'Create a set of basic design system components',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('create_design_system_components', {});
    }
  },
  
  apply_text_property: {
    description: 'Apply a text property to a text node in a component',
    parameters: {
      type: 'object',
      properties: {
        componentId: {
          type: 'string',
          description: 'ID of the component'
        },
        textNodeId: {
          type: 'string',
          description: 'ID of the text node'
        },
        propertyName: {
          type: 'string',
          description: 'Name for the text property'
        }
      },
      required: ['componentId', 'textNodeId', 'propertyName']
    },
    handler: async ({ componentId, textNodeId, propertyName }) => {
      return await sendFigmaCommand('apply_text_property', { componentId, textNodeId, propertyName });
    }
  },
  
  create_instance_swap_property: {
    description: 'Create an instance swap property for nested components',
    parameters: {
      type: 'object',
      properties: {
        componentId: {
          type: 'string',
          description: 'ID of the component'
        },
        propertyName: {
          type: 'string',
          description: 'Name for the instance swap property'
        },
        defaultComponentKey: {
          type: 'string',
          description: 'Key of the default component for this property'
        }
      },
      required: ['componentId', 'propertyName']
    },
    handler: async ({ componentId, propertyName, defaultComponentKey }) => {
      return await sendFigmaCommand('create_instance_swap_property', { componentId, propertyName, defaultComponentKey });
    }
  }
};

// Function to initialize the tools with MCP server functions
function initializeTools(mcpServer) {
  sendFigmaCommand = mcpServer.sendFigmaCommand;
  getActiveChannelId = mcpServer.getActiveChannelId;
  setActiveChannelId = mcpServer.setActiveChannelId;
  getWebSocketClient = mcpServer.getWebSocketClient;
}

module.exports = { tools, initializeTools };
