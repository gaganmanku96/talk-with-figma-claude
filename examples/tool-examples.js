// Example usage of the improved Figma tools with fixes applied

// Example 1: Using the enhanced set_fill_color with backwards compatibility
async function example1_setFillColor() {
  // Old format (still works)
  await set_fill_color({
    nodeId: '48:108',
    r: 0.5,
    g: 0.8,
    b: 0.3,
    a: 0.9
  });
  
  // New format with fills array
  await set_fill_color({
    nodeId: '48:108',
    fills: [
      {
        type: 'SOLID',
        color: { r: 0.5, g: 0.8, b: 0.3 },
        opacity: 0.9
      }
    ]
  });
  
  // Gradient example
  await set_fill_color({
    nodeId: '48:108',
    fills: [
      {
        type: 'LINEAR_GRADIENT',
        gradientStops: [
          { position: 0, color: { r: 0.42, g: 0.17, b: 0.88 } },
          { position: 1, color: { r: 0.24, g: 0.53, b: 0.92 } }
        ],
        gradientTransform: [[0, -1, 1], [1, 0, 0]]
      }
    ]
  });
}

// Example 2: Creating component instances with better error handling
async function example2_createInstance() {
  // First, get available components
  const components = await get_local_components();
  console.log('Available components:', components);
  
  // Create an instance with enhanced error handling
  try {
    const instance = await create_component_instance({
      componentId: '48:103', // Button/Primary component
      x: 50,
      y: 480,
      parentId: '47:82',
      name: 'Send OTP Button Instance'
    });
    console.log('Created instance:', instance);
  } catch (error) {
    console.error('Error creating instance:', error.message);
    // The error message will now be more helpful, e.g.:
    // "Node 48:103 is an instance, not a component. Use its mainComponent ID instead."
  }
}

// Example 3: Creating variables with proper color formatting
async function example3_createVariables() {
  // Create a variable collection
  const collection = await create_variable_collection({
    name: 'My Design System',
    modes: ['Light', 'Dark']
  });
  
  // Create a color variable with automatic formatting
  const colorVar = await create_variable({
    collectionId: collection.id,
    name: 'primary-color',
    type: 'COLOR',
    value: { r: 0.42, g: 0.17, b: 0.88 } // Will be normalized to 0-1 range
  });
  
  // Set values for different modes
  await set_variable_mode_value({
    variableId: colorVar.id,
    modeId: collection.modes[1].id, // Dark mode
    value: { r: 0.6, g: 0.4, b: 0.9 }
  });
}

// Example 4: Creating a component-based design system
async function example4_createDesignSystem() {
  // Create a button component with customizable properties
  const button = await create_button_component({
    name: 'Primary Button',
    size: 'medium'
  });
  
  // Create an input component
  const input = await create_component({
    name: 'Text Input',
    width: 312,
    height: 60,
    x: -500,
    y: -200
  });
  
  // Style the input component
  await set_fill_color({
    nodeId: input.id,
    fills: [
      {
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 0.1
      }
    ]
  });
  
  await set_stroke({
    nodeId: input.id,
    strokes: [
      {
        type: 'SOLID',
        color: { r: 1, g: 1, b: 1 },
        opacity: 0.3,
        weight: 1
      }
    ]
  });
  
  await set_corner_radius({
    nodeId: input.id,
    radius: 12
  });
  
  // Now create instances of these components
  const buttonInstance = await create_component_instance({
    componentId: button.id,
    x: 50,
    y: 480,
    parentId: '47:82',
    name: 'Send OTP Button'
  });
  
  const inputInstance = await create_component_instance({
    componentId: input.id,
    x: 50,
    y: 380,
    parentId: '47:82',
    name: 'Phone Number Input'
  });
  
  // Update instance properties
  await update_instance_properties({
    instanceId: buttonInstance.id,
    properties: {
      'Label': 'Send OTP'
    }
  });
}

// Example 5: Batch operations for better performance
async function example5_batchOperations() {
  // Create multiple component instances at once
  const instances = await create_multiple_instances({
    instances: [
      { componentId: '48:107', x: 41, y: 380, parentId: '48:83', name: 'OTP Box 1' },
      { componentId: '48:107', x: 101, y: 380, parentId: '48:83', name: 'OTP Box 2' },
      { componentId: '48:107', x: 161, y: 380, parentId: '48:83', name: 'OTP Box 3' },
      { componentId: '48:107', x: 221, y: 380, parentId: '48:83', name: 'OTP Box 4' },
      { componentId: '48:107', x: 281, y: 380, parentId: '48:83', name: 'OTP Box 5' },
      { componentId: '48:107', x: 341, y: 380, parentId: '48:83', name: 'OTP Box 6' }
    ]
  });
  
  console.log('Created instances:', instances);
}

// Run examples
async function runExamples() {
  console.log('Running enhanced Figma tools examples...');
  
  try {
    await example1_setFillColor();
    console.log('✓ Fill color example completed');
    
    await example2_createInstance();
    console.log('✓ Component instance example completed');
    
    await example3_createVariables();
    console.log('✓ Variables example completed');
    
    await example4_createDesignSystem();
    console.log('✓ Design system example completed');
    
    await example5_batchOperations();
    console.log('✓ Batch operations example completed');
  } catch (error) {
    console.error('Error in examples:', error);
  }
}

// Export for use in other modules
module.exports = {
  example1_setFillColor,
  example2_createInstance,
  example3_createVariables,
  example4_createDesignSystem,
  example5_batchOperations,
  runExamples
};
