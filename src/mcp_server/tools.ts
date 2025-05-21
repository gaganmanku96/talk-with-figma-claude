import { sendFigmaCommand, getActiveChannelId } from './websocketClient';
import { getWebSocketClient } from './server';

// Define the MCP tools
export const tools = {
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
    handler: async ({ channelId }: { channelId?: string }) => {
      const ws = getWebSocketClient();
      
      if (!ws) {
        throw new Error('WebSocket is not connected');
      }
      
      ws.send(JSON.stringify({
        type: 'join_channel',
        channelId
      }));
      
      return { 
        message: channelId 
          ? `Attempting to join channel: ${channelId}` 
          : 'Creating a new channel...',
        tip: 'Make sure to also run the Figma plugin and join the same channel'
      };
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
    handler: async ({ nodeId }: { nodeId: string }) => {
      return await sendFigmaCommand('get_node_info', { nodeId });
    }
  },
  
  get_nodes_info: {
    description: 'Get detailed information about multiple nodes',
    parameters: {
      type: 'object',
      properties: {
        nodeIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'The IDs of the nodes to get information about'
        }
      },
      required: ['nodeIds']
    },
    handler: async ({ nodeIds }: { nodeIds: string[] }) => {
      return await sendFigmaCommand('get_nodes_info', { nodeIds });
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
    handler: async (params: any) => {
      return await sendFigmaCommand('create_rectangle', params);
    }
  },
  
  create_frame: {
    description: 'Create a new frame with position, size, and optional name',
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
    handler: async (params: any) => {
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
    handler: async (params: any) => {
      return await sendFigmaCommand('create_text', params);
    }
  },
  
  // Text tools
  scan_text_nodes: {
    description: 'Scan text nodes with intelligent chunking for large designs',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'Optional node ID to scan. If not provided, uses the current selection'
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to scan recursively through children'
        },
        chunkSize: {
          type: 'number',
          description: 'Number of text nodes to process in each chunk'
        }
      }
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('scan_text_nodes', params);
    }
  },
  
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
    handler: async ({ nodeId, text }: { nodeId: string, text: string }) => {
      return await sendFigmaCommand('set_text_content', { nodeId, text });
    }
  },
  
  set_multiple_text_contents: {
    description: 'Batch update multiple text nodes efficiently',
    parameters: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
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
          description: 'Array of text content updates'
        }
      },
      required: ['updates']
    },
    handler: async ({ updates }: { updates: Array<{ nodeId: string, text: string }> }) => {
      return await sendFigmaCommand('set_multiple_text_contents', { updates });
    }
  },
  
  // Style tools
  set_fill_color: {
    description: 'Set the fill color of a node (RGBA)',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node'
        },
        r: {
          type: 'number',
          description: 'Red component (0-1)'
        },
        g: {
          type: 'number',
          description: 'Green component (0-1)'
        },
        b: {
          type: 'number',
          description: 'Blue component (0-1)'
        },
        a: {
          type: 'number',
          description: 'Alpha component (0-1)'
        }
      },
      required: ['nodeId', 'r', 'g', 'b', 'a']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('set_fill_color', params);
    }
  },
  
  // Component tools
  get_local_components: {
    description: 'Get information about local components',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return await sendFigmaCommand('get_local_components', {});
    }
  },
  
  create_component_instance: {
    description: 'Create an instance of a component',
    parameters: {
      type: 'object',
      properties: {
        componentId: {
          type: 'string',
          description: 'The ID of the component to instantiate'
        },
        x: {
          type: 'number',
          description: 'The x position of the instance'
        },
        y: {
          type: 'number',
          description: 'The y position of the instance'
        },
        name: {
          type: 'string',
          description: 'Optional name for the instance'
        },
        parentId: {
          type: 'string',
          description: 'Optional parent node ID'
        }
      },
      required: ['componentId', 'x', 'y']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('create_component_instance', params);
    }
  },
  
  // Export tools
  export_node_as_image: {
    description: 'Export a node as an image (PNG, JPG, SVG, or PDF)',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'The ID of the node to export'
        },
        format: {
          type: 'string',
          enum: ['PNG', 'JPG', 'SVG', 'PDF'],
          description: 'The export format'
        },
        scale: {
          type: 'number',
          description: 'The export scale (1-4)'
        }
      },
      required: ['nodeId', 'format']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('export_node_as_image', params);
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
  
  read_design_strategy: {
    description: 'Best practices for reading Figma designs',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        strategy: `
# Figma Design Reading Strategy

## Document Overview
1. Use get_document_info to understand the document structure and organization
2. Identify key pages and frames
3. Note any project-specific naming conventions

## Element Analysis
1. Examine the design hierarchy from top to bottom
2. Use get_node_info to get detailed information about specific elements
3. Look for patterns in the design organization

## Text and Content
1. Use scan_text_nodes to identify and analyze text content
2. Pay attention to text hierarchy (headings, body text, captions)
3. Note any content patterns or placeholder text

## Component Identification
1. Use get_local_components to understand the component system
2. Identify component instances and their relationships
3. Note variants and component properties

## Design System Analysis
1. Identify color patterns and recurring visual elements
2. Note typography choices and text styles
3. Analyze spacing and alignment patterns
4. Look for responsive design patterns

## Interaction Understanding
1. Look for interactive elements and state variations
2. Note micro-interactions and transitions if documented
3. Understand the user flow through the design
`
      };
    }
  },
  
  text_replacement_strategy: {
    description: 'Systematic approach for replacing text in Figma designs',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        strategy: `
# Text Replacement Strategy for Figma

## Preparation
1. Use scan_text_nodes to inventory all text elements
2. Group text nodes by type (headings, paragraphs, labels, etc.)
3. Identify text patterns and placeholder content

## Batch Updates
1. Prepare text updates in organized batches
2. Use set_multiple_text_contents for efficient bulk updates
3. Process text groups in order of importance (headings first, then body text)

## Formatting Preservation
1. Maintain original text styling (font, size, weight)
2. Preserve text alignment and positioning
3. Respect existing text overflow behavior

## Content Consistency
1. Ensure consistent terminology throughout the design
2. Match style guidelines for capitalization, punctuation, and formatting
3. Follow brand voice and tone guidelines

## Validation
1. Review all updated text for accuracy and consistency
2. Check text overflow and wrapping behavior
3. Verify that text changes maintain the design's visual hierarchy
4. Ensure localization and accessibility standards are met
`
      };
    }
  },
  
  annotation_conversion_strategy: {
    description: 'Strategy for converting manual annotations to Figma\'s native annotations',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        strategy: `
# Annotation Conversion Strategy for Figma

## Annotation Inventory
1. Use scan_text_nodes to find existing text-based annotations
2. Identify numbered markers and their corresponding descriptions
3. Map annotations to their target elements

## Target Element Identification
1. Use scan_nodes_by_types to find UI elements that annotations refer to
2. Match markers with target elements using node paths, names, or proximity
3. Verify the correct target-annotation pairing

## Native Annotation Creation
1. Create native annotations with set_annotation or set_multiple_annotations
2. Link each annotation to its proper target element
3. Transfer the annotation content from the text-based annotation
4. Position annotations appropriately relative to their targets

## Cleanup
1. Remove legacy text-based annotations after successful conversion
2. Organize annotations for optimal visibility and clarity
3. Group related annotations logically

## Validation
1. Verify all annotations are properly linked to their targets
2. Check annotation content for accuracy and clarity
3. Ensure annotations follow design system guidelines
4. Test annotation visibility in different zoom levels
`
      };
    }
  },
  
  swap_overrides_instances: {
    description: 'Strategy for transferring overrides between component instances in Figma',
    parameters: {
      type: 'object',
      properties: {}
    },
    handler: async () => {
      return {
        strategy: `
# Component Instance Override Transfer Strategy

## Source Instance Analysis
1. Select the source component instance with desired overrides
2. Use get_instance_overrides to extract the current override properties
3. Analyze the override structure and hierarchy

## Target Instance Preparation
1. Identify target component instances that need the same overrides
2. Verify that target instances are of the same component or compatible components
3. Group targets by component type if working with multiple component types

## Override Application
1. Use set_instance_overrides to apply extracted overrides to target instances
2. Apply overrides in batches for efficiency
3. Handle nested component overrides appropriately

## Validation
1. Verify that overrides have been correctly applied to all target instances
2. Check for any unexpected behavior or visual discrepancies
3. Test interactive states if applicable
4. Ensure consistent appearance across all instances

## Optimization
1. Document the override patterns for future use
2. Consider creating component variants if the same overrides are frequently reused
3. Organize instances with similar overrides for easier management
`
      };
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
    handler: async ({ name, modes }: { name: string, modes?: string[] }) => {
      return await sendFigmaCommand('create_variable_collection', { name, modes: modes || ['Default'] });
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
    handler: async ({ collectionId, name, type, value }: { collectionId: string, name: string, type: string, value?: any }) => {
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
    handler: async ({ variableId, modeId, value }: { variableId: string, modeId: string, value: any }) => {
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
    handler: async ({ collectionId }: { collectionId: string }) => {
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
    handler: async ({ jsonData }: { jsonData: string }) => {
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
    handler: async ({ name, width, height, x, y }: { name: string, width: number, height: number, x?: number, y?: number }) => {
      return await sendFigmaCommand('create_component', { name, width, height, x: x || 0, y: y || 0 });
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
    handler: async ({ nodeId }: { nodeId: string }) => {
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
    handler: async ({ componentId, propertyName, propertyType, defaultValue }: { componentId: string, propertyName: string, propertyType: string, defaultValue?: any }) => {
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
    handler: async ({ name, variants }: { name: string, variants: any[] }) => {
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
    handler: async ({ componentKey }: { componentKey: string }) => {
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
    handler: async ({ instanceId, properties }: { instanceId: string, properties: any }) => {
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
    handler: async ({ name, size }: { name?: string, size?: string }) => {
      return await sendFigmaCommand('create_button_component', { name: name || 'Button', size: size || 'medium' });
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
    handler: async ({ componentId, textNodeId, propertyName }: { componentId: string, textNodeId: string, propertyName: string }) => {
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
    handler: async ({ componentId, propertyName, defaultComponentKey }: { componentId: string, propertyName: string, defaultComponentKey?: string }) => {
      return await sendFigmaCommand('create_instance_swap_property', { componentId, propertyName, defaultComponentKey });
    }
  },
  
  // Alignment & Distribution tools
  align_elements: {
    description: 'Align selected elements with specified alignment option',
    parameters: {
      type: 'object',
      properties: {
        alignmentType: {
          type: 'string',
          enum: ['LEFT', 'RIGHT', 'CENTER', 'TOP', 'MIDDLE', 'BOTTOM'],
          description: 'The type of alignment to apply'
        },
        nodeIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Optional array of node IDs to align. If not provided, uses current selection.'
        },
        boundingBox: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            width: { type: 'number' },
            height: { type: 'number' }
          },
          description: 'Optional bounding box to align to instead of selection bounds.'
        }
      },
      required: ['alignmentType']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('align_elements', params);
    }
  },
  
  distribute_elements: {
    description: 'Distribute selected elements evenly',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['HORIZONTAL', 'VERTICAL'],
          description: 'The direction to distribute elements'
        },
        nodeIds: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Optional array of node IDs to distribute. If not provided, uses current selection.'
        },
        spacing: {
          type: 'number',
          description: 'Optional fixed spacing between elements. If provided, elements will be distributed with this exact spacing rather than evenly across the available space.'
        }
      },
      required: ['direction']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('distribute_elements', params);
    }
  },
  
  // Grid Layout Generator
  create_grid_layout: {
    description: 'Create an advanced grid layout with multiple configuration options',
    parameters: {
      type: 'object',
      properties: {
        columns: {
          type: 'number',
          description: 'Number of columns in the grid'
        },
        rows: {
          type: 'number',
          description: 'Number of rows in the grid (optional, will be calculated from itemCount if not provided)'
        },
        itemCount: {
          type: 'number',
          description: 'Total number of items to generate'
        },
        columnGap: {
          type: 'number',
          description: 'Gap between columns'
        },
        rowGap: {
          type: 'number',
          description: 'Gap between rows'
        },
        cellWidth: {
          type: 'number',
          description: 'Width of each cell in the grid'
        },
        cellHeight: {
          type: 'number',
          description: 'Height of each cell in the grid'
        },
        parentId: {
          type: 'string',
          description: 'Optional parent node ID'
        },
        x: {
          type: 'number',
          description: 'X position of the grid frame'
        },
        y: {
          type: 'number',
          description: 'Y position of the grid frame'
        },
        name: {
          type: 'string',
          description: 'Name for the grid frame'
        },
        fillItems: {
          type: 'boolean',
          description: 'Whether to fill grid cells with placeholder rectangles'
        },
        useAutoLayout: {
          type: 'boolean',
          description: 'Whether to use auto layout for the grid (default: true)'
        },
        responsive: {
          type: 'boolean',
          description: 'Whether to make the grid responsive with auto layout (only applies if useAutoLayout is true)'
        },
        templateAreas: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'CSS-like grid template areas for named grid areas'
        }
      },
      required: ['columns', 'cellWidth', 'cellHeight']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('create_grid_layout', params);
    }
  },
  
  // Component Property Batch Editor
  batch_edit_component_properties: {
    description: 'Batch edit properties of multiple component instances',
    parameters: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
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
          description: 'Array of updates for component instances'
        },
        propertyPresets: {
          type: 'object',
          description: 'Predefined property values to apply across multiple instances'
        },
        propertyFilter: {
          type: 'object',
          properties: {
            names: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Filter to only update properties with these names'
            },
            types: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['TEXT', 'BOOLEAN', 'INSTANCE_SWAP', 'VARIANT']
              },
              description: 'Filter to only update properties of these types'
            }
          },
          description: 'Filter which properties to update'
        },
        applyToSelection: {
          type: 'boolean',
          description: 'Whether to apply updates to all selected component instances'
        }
      },
      required: ['updates']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('batch_edit_component_properties', params);
    }
  },
  
  // Design Token Converter
  convert_design_tokens: {
    description: 'Convert design tokens (variables) between different formats',
    parameters: {
      type: 'object',
      properties: {
        source: {
          type: 'string',
          enum: ['figma', 'css', 'scss', 'js', 'tailwind', 'json', 'android', 'ios'],
          description: 'Source format of design tokens'
        },
        target: {
          type: 'string',
          enum: ['figma', 'css', 'scss', 'js', 'tailwind', 'json', 'android', 'ios'],
          description: 'Target format to convert design tokens to'
        },
        collectionId: {
          type: 'string',
          description: 'ID of variable collection (if source is "figma")'
        },
        tokens: {
          type: 'string', 
          description: 'JSON string of design tokens (if source is not "figma")'
        },
        prefix: {
          type: 'string',
          description: 'Optional prefix for generated variable names'
        },
        nameFormat: {
          type: 'string',
          enum: ['kebab-case', 'camelCase', 'PascalCase', 'snake_case'],
          description: 'Naming convention for generated variables'
        },
        includeComments: {
          type: 'boolean',
          description: 'Whether to include descriptive comments in the output'
        },
        groupByCategory: {
          type: 'boolean',
          description: 'Whether to group variables by category in the output'
        }
      },
      required: ['source', 'target']
    },
    handler: async (params: any) => {
      return await sendFigmaCommand('convert_design_tokens', params);
    }
  }
};
