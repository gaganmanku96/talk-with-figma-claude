// Enhanced tools to fix the issues identified
// This file contains fixes and improvements to the existing tools

// Fix for color variable issues - helper function to properly format colors
function formatColorForFigma(color) {
  // Ensure we have r, g, b values between 0 and 1
  const result = {
    r: Math.max(0, Math.min(1, color.r || 0)),
    g: Math.max(0, Math.min(1, color.g || 0)),
    b: Math.max(0, Math.min(1, color.b || 0))
  };
  
  // Add alpha if provided
  if (color.a !== undefined) {
    result.a = Math.max(0, Math.min(1, color.a));
  }
  
  return result;
}

// Enhanced create_component_instance to handle better error messages
const enhanced_create_component_instance = {
  description: 'Create an instance of a component with enhanced error handling',
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
  handler: async (params) => {
    try {
      // First, verify the component exists
      const componentInfo = await sendFigmaCommand('get_node_info', { nodeId: params.componentId });
      
      if (!componentInfo || componentInfo.type !== 'COMPONENT') {
        throw new Error(`Node ${params.componentId} is not a component. Found type: ${componentInfo?.type || 'unknown'}`);
      }
      
      // Create the instance
      return await sendFigmaCommand('create_component_instance', params);
    } catch (error) {
      // Provide more helpful error messages
      if (error.message.includes('not found')) {
        throw new Error(`Component ${params.componentId} not found. Use get_local_components to see available components.`);
      }
      throw error;
    }
  }
};

// Enhanced set_fill_color with better gradient support
const enhanced_set_fill_color = {
  description: 'Set fill color with automatic format detection and fixes',
  parameters: {
    type: 'object',
    properties: {
      nodeId: {
        type: 'string',
        description: 'The ID of the node to style'
      },
      fills: {
        type: 'array',
        description: 'Array of fill objects or a single color object for backwards compatibility',
        items: {
          type: 'object'
        }
      },
      // Backwards compatibility
      color: {
        type: 'object',
        description: 'Single color object (deprecated, use fills array instead)'
      },
      opacity: {
        type: 'number',
        description: 'Opacity (deprecated, use fills array instead)'
      }
    },
    required: ['nodeId']
  },
  handler: async ({ nodeId, fills, color, opacity }) => {
    // Handle backwards compatibility
    if (!fills && color) {
      fills = [{
        type: 'SOLID',
        color: formatColorForFigma(color),
        opacity: opacity !== undefined ? opacity : 1
      }];
    }
    
    // Process fills array
    const processedFills = fills.map(fill => {
      const processed = { ...fill };
      
      if (fill.type === 'SOLID' && fill.color) {
        processed.color = formatColorForFigma(fill.color);
      }
      
      if (fill.type === 'LINEAR_GRADIENT' || fill.type === 'RADIAL_GRADIENT') {
        if (fill.gradientStops) {
          processed.gradientStops = fill.gradientStops.map(stop => ({
            position: stop.position,
            color: formatColorForFigma(stop.color)
          }));
        }
      }
      
      return processed;
    });
    
    return await sendFigmaCommand('set_fill_color', { nodeId, fills: processedFills });
  }
};

// Helper function to create component instances with better error handling
const create_component_instance_safe = async (componentId, x, y, parentId, name) => {
  try {
    // Get component info first
    const componentInfo = await sendFigmaCommand('get_node_info', { nodeId: componentId });
    
    if (!componentInfo) {
      throw new Error(`Component ${componentId} not found`);
    }
    
    if (componentInfo.type !== 'COMPONENT') {
      // Try to find the main component if this is an instance
      if (componentInfo.type === 'INSTANCE' && componentInfo.mainComponent) {
        componentId = componentInfo.mainComponent.id;
      } else {
        throw new Error(`Node ${componentId} is not a component (type: ${componentInfo.type})`);
      }
    }
    
    // Create the instance
    const params = { componentId, x, y };
    if (parentId) params.parentId = parentId;
    if (name) params.name = name;
    
    return await sendFigmaCommand('create_component_instance', params);
  } catch (error) {
    console.error(`Error creating component instance: ${error.message}`);
    throw error;
  }
};

// Enhanced variable creation with proper type handling
const enhanced_create_variable = {
  description: 'Create a variable with automatic type conversion',
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
        description: 'Initial value for the variable (automatically formatted based on type)'
      }
    },
    required: ['collectionId', 'name', 'type']
  },
  handler: async ({ collectionId, name, type, value }) => {
    // Format value based on type
    let formattedValue = value;
    
    if (type === 'COLOR' && value) {
      formattedValue = formatColorForFigma(value);
    }
    
    return await sendFigmaCommand('create_variable', { 
      collectionId, 
      name, 
      type, 
      value: formattedValue 
    });
  }
};

// Batch component instance creation
const create_multiple_instances = {
  description: 'Create multiple component instances at once',
  parameters: {
    type: 'object',
    properties: {
      instances: {
        type: 'array',
        description: 'Array of instance configurations',
        items: {
          type: 'object',
          properties: {
            componentId: { type: 'string' },
            x: { type: 'number' },
            y: { type: 'number' },
            name: { type: 'string' },
            parentId: { type: 'string' }
          },
          required: ['componentId', 'x', 'y']
        }
      }
    },
    required: ['instances']
  },
  handler: async ({ instances }) => {
    const results = [];
    
    for (const instance of instances) {
      try {
        const result = await create_component_instance_safe(
          instance.componentId,
          instance.x,
          instance.y,
          instance.parentId,
          instance.name
        );
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          componentId: instance.componentId 
        });
      }
    }
    
    return results;
  }
};

// Export the enhanced tools
module.exports = {
  enhanced_create_component_instance,
  enhanced_set_fill_color,
  enhanced_create_variable,
  create_multiple_instances,
  create_component_instance_safe,
  formatColorForFigma
};
