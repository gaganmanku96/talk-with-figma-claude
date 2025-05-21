// This is the main code for the Figma plugin
// It communicates with the UI and handles Figma API calls

// Show the UI
figma.showUI(__html__, { width: 400, height: 500 });

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  // Process messages based on the message type
  switch (msg.type) {
    case 'websocket_message':
      // Handle incoming WebSocket messages
      try {
        const data = msg.data;

        if (data.type === 'figma_command') {
          // Execute a command from Claude/MCP
          handleFigmaCommand(data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        figma.ui.postMessage({
          type: 'error',
          message: 'Error processing WebSocket message: ' + error.message
        });
      }
      break;

    case 'notify':
      // Display a notification
      figma.notify(msg.message);
      break;

    case 'close':
      // Close the plugin
      figma.closePlugin();
      break;
  }
};

// Handle Figma commands from Claude/MCP
async function handleFigmaCommand(data) {
  const { command, params, requestId, channelId } = data;
  let result;

  try {
    // Execute the appropriate command
    result = await executeCommand(command, params);

    // Send the result back through the WebSocket
    figma.ui.postMessage({
      type: 'websocket_send',
      data: {
        type: 'figma_response',
        requestId,
        channelId,
        result
      }
    });

  } catch (error) {
    console.error(`Error executing command ${command}:`, error);

    // Send error back through the WebSocket
    figma.ui.postMessage({
      type: 'websocket_send',
      data: {
        type: 'figma_response',
        requestId,
        channelId,
        error: error.message || 'An error occurred'
      }
    });
  }
}

// Execute a specific Figma command
async function executeCommand(command, params) {
  switch (command) {
    case 'get_document_info':
      return getDocumentInfo();

    case 'get_selection':
      return getSelection();

    case 'read_my_design':
      return readMyDesign();

    case 'get_node_info':
      return getNodeInfo(params.nodeId);

    case 'get_nodes_info':
      return getNodesInfo(params.nodeIds);

    case 'create_rectangle':
      return createRectangle(params);

    case 'create_frame':
      return createFrame(params);

    case 'create_frame_with_auto_layout':
      return createFrameWithAutoLayout(params);

    case 'modify_auto_layout':
      return modifyAutoLayout(params);
      
    case 'toggle_auto_layout_direction':
      return toggleAutoLayoutDirection(params);
      
    case 'apply_auto_layout_to_selection':
      return applyAutoLayoutToSelection(params);
      
    case 'set_auto_layout_sizing':
      return setAutoLayoutSizing(params);

    case 'create_text':
      return createText(params);

    case 'scan_text_nodes':
      return scanTextNodes(params);

    case 'set_text_content':
      return setTextContent(params.nodeId, params.text);

    case 'set_multiple_text_contents':
      return setMultipleTextContents(params.updates);

    case 'set_fill_color':
      return setFillColor(params);

    case 'set_corner_radius':
      return setCornerRadius(params);

    case 'set_stroke':
      return setStroke(params);

    case 'set_effects':
      return setEffects(params);

    case 'get_local_components':
      return getLocalComponents();
      
    case 'get_component_data':
      return getComponentData(params);
      
    case 'get_enhanced_component_library':
      return getEnhancedComponentLibrary(params);

    case 'create_component_instance':
      return createComponentInstance(params);

    case 'export_node_as_image':
      return exportNodeAsImage(params);

    case 'create_image_from_url':
      return createImageFromUrl(params);

    case 'set_image_fill':
      return setImageFill(params);
      
    case 'delete_node':
      return deleteNode(params);

    // Variable creation and management commands
    case 'create_variable_collection':
      return createVariableCollection(params);
      
    case 'create_variable':
      return createVariable(params);
      
    case 'set_variable_mode_value':
      return setVariableModeValue(params);
      
    case 'get_all_variable_collections':
      return getAllVariableCollections();
      
    case 'get_variables_by_collection':
      return getVariablesByCollection(params);
      
    case 'import_variables_from_json':
      return importVariablesFromJson(params);
      
    case 'export_variables_to_json':
      return exportVariablesToJson();
      
    case 'create_design_tokens':
      return createDesignTokens();
      
    // Component creation and management commands
    case 'create_component':
      return createComponent(params);
      
    case 'create_component_from_node':
      return createComponentFromNode(params);
      
    case 'add_component_property':
      return addComponentProperty(params);
      
    case 'create_component_set':
      return createComponentSet(params);
      
    case 'import_component_from_library':
      return importComponentFromLibrary(params);
      
    case 'update_instance_properties':
      return updateInstanceProperties(params);
      
    case 'create_button_component':
      return createButtonComponent(params);
      
    case 'create_design_system_components':
      return createDesignSystemComponents();
      
    case 'apply_text_property':
      return applyTextProperty(params);
      
    case 'create_instance_swap_property':
      return createInstanceSwapProperty(params);

    case 'align_elements':
      return alignElements(params);

    case 'distribute_elements':
      return distributeElements(params);
      
    case 'create_grid_layout':
      return createGridLayout(params);
      
    case 'batch_edit_component_properties':
      return batchEditComponentProperties(params);
      
    case 'convert_design_tokens':
      return convertDesignTokens(params);

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Command implementations

// Get information about the current document
function getDocumentInfo() {
  return {
    name: figma.root.name,
    id: figma.root.id,
    type: figma.root.type,
    children: figma.root.children.map(page => ({
      id: page.id,
      name: page.name,
      type: page.type,
      childCount: (page.children && page.children.length) || 0
    }))
  };
}

// Apply auto layout to the current selection
async function applyAutoLayoutToSelection(params) {
  const { 
    layoutMode = 'VERTICAL',          // Default to vertical layout
    itemSpacing = 10,                // Default spacing
    padding = 0,                     // Default padding
    primaryAxisAlignItems = 'MIN',   // Default alignment
    counterAxisAlignItems = 'MIN',   // Default alignment
    wrapInNewFrame = false,          // Whether to create a new frame
    frameName = 'Auto Layout Frame'  // Name for the new frame
  } = params;
  
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    throw new Error('No elements selected. Please select at least one element.');
  }
  
  // If wrapInNewFrame is true, we create a new frame and add selected elements to it
  if (wrapInNewFrame) {
    // Find the bounds of the selection
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    selection.forEach(node => {
      if ('x' in node && 'y' in node && 'width' in node && 'height' in node) {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + node.width);
        maxY = Math.max(maxY, node.y + node.height);
      }
    });
    
    // Add some margin
    const margin = 20;
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;
    
    // Create a new frame
    const frame = figma.createFrame();
    frame.name = frameName;
    frame.x = minX;
    frame.y = minY;
    frame.resize(maxX - minX, maxY - minY);
    
    // Apply auto layout
    frame.layoutMode = layoutMode;
    frame.itemSpacing = itemSpacing;
    
    // Apply padding
    if (typeof padding === 'number') {
      frame.paddingTop = padding;
      frame.paddingRight = padding;
      frame.paddingBottom = padding;
      frame.paddingLeft = padding;
    } else if (typeof padding === 'object') {
      if (padding.top !== undefined) frame.paddingTop = padding.top;
      if (padding.right !== undefined) frame.paddingRight = padding.right;
      if (padding.bottom !== undefined) frame.paddingBottom = padding.bottom;
      if (padding.left !== undefined) frame.paddingLeft = padding.left;
    }
    
    frame.primaryAxisAlignItems = primaryAxisAlignItems;
    frame.counterAxisAlignItems = counterAxisAlignItems;
    
    // Add the selected elements to the frame
    const nodesToMove = [...selection];
    nodesToMove.forEach(node => {
      // Adjust the position within the frame
      if ('x' in node && 'y' in node) {
        node.x = node.x - minX;
        node.y = node.y - minY;
      }
      
      // Add to the frame
      frame.appendChild(node);
    });
    
    // Select the new frame
    figma.currentPage.selection = [frame];
    
    return {
      id: frame.id,
      name: frame.name,
      type: frame.type,
      layoutMode: frame.layoutMode,
      itemSpacing: frame.itemSpacing,
      padding: {
        top: frame.paddingTop,
        right: frame.paddingRight,
        bottom: frame.paddingBottom,
        left: frame.paddingLeft
      },
      childCount: frame.children.length,
      children: frame.children.map(child => ({ id: child.id, name: child.name }))
    };
  } else {
    // Apply auto layout to each selected frame or group
    const results = [];
    
    for (const node of selection) {
      // Check if the node can have auto layout
      const validTypes = ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION'];
      
      if (validTypes.includes(node.type)) {
        // Apply auto layout
        node.layoutMode = layoutMode;
        node.itemSpacing = itemSpacing;
        
        // Apply padding
        if (typeof padding === 'number') {
          node.paddingTop = padding;
          node.paddingRight = padding;
          node.paddingBottom = padding;
          node.paddingLeft = padding;
        } else if (typeof padding === 'object') {
          if (padding.top !== undefined) node.paddingTop = padding.top;
          if (padding.right !== undefined) node.paddingRight = padding.right;
          if (padding.bottom !== undefined) node.paddingBottom = padding.bottom;
          if (padding.left !== undefined) node.paddingLeft = padding.left;
        }
        
        node.primaryAxisAlignItems = primaryAxisAlignItems;
        node.counterAxisAlignItems = counterAxisAlignItems;
        
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          layoutMode: node.layoutMode,
          itemSpacing: node.itemSpacing,
          padding: {
            top: node.paddingTop,
            right: node.paddingRight,
            bottom: node.paddingBottom,
            left: node.paddingLeft
          },
          childCount: 'children' in node ? node.children.length : 0
        });
      } else if (node.type === 'GROUP') {
        // For groups, convert to frame first
        const frameNode = figma.createFrame();
        frameNode.name = node.name;
        frameNode.x = node.x;
        frameNode.y = node.y;
        frameNode.resize(node.width, node.height);
        
        // Apply auto layout
        frameNode.layoutMode = layoutMode;
        frameNode.itemSpacing = itemSpacing;
        
        // Apply padding
        if (typeof padding === 'number') {
          frameNode.paddingTop = padding;
          frameNode.paddingRight = padding;
          frameNode.paddingBottom = padding;
          frameNode.paddingLeft = padding;
        } else if (typeof padding === 'object') {
          if (padding.top !== undefined) frameNode.paddingTop = padding.top;
          if (padding.right !== undefined) frameNode.paddingRight = padding.right;
          if (padding.bottom !== undefined) frameNode.paddingBottom = padding.bottom;
          if (padding.left !== undefined) frameNode.paddingLeft = padding.left;
        }
        
        frameNode.primaryAxisAlignItems = primaryAxisAlignItems;
        frameNode.counterAxisAlignItems = counterAxisAlignItems;
        
        // Move group's children to the new frame
        if ('children' in node) {
          const groupChildren = [...node.children];
          groupChildren.forEach(child => {
            if ('x' in child && 'y' in child) {
              // Adjust position to be relative to the group
              child.x = child.x - node.x;
              child.y = child.y - node.y;
            }
            frameNode.appendChild(child);
          });
        }
        
        // Replace the group with the frame
        if (node.parent) {
          node.parent.insertChild(node.parent.children.indexOf(node), frameNode);
          node.remove();
        }
        
        results.push({
          id: frameNode.id,
          name: frameNode.name,
          type: frameNode.type,
          layoutMode: frameNode.layoutMode,
          itemSpacing: frameNode.itemSpacing,
          padding: {
            top: frameNode.paddingTop,
            right: frameNode.paddingRight,
            bottom: frameNode.paddingBottom,
            left: frameNode.paddingLeft
          },
          childCount: frameNode.children.length,
          convertedFromGroup: true
        });
      } else {
        // Skip nodes that can't have auto layout
        results.push({
          id: node.id,
          name: node.name,
          type: node.type,
          skipped: true,
          reason: `Node type '${node.type}' does not support auto layout`
        });
      }
    }
    
    return {
      count: results.length,
      modified: results.filter(r => !r.skipped).length,
      skipped: results.filter(r => r.skipped).length,
      results
    };
  }
}

// Set auto layout sizing modes
function setAutoLayoutSizing(params) {
  const { 
    nodeId, 
    primaryAxisSizingMode, 
    counterAxisSizingMode,
    resizeChildren = false
  } = params;

  // Get the node
  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  // Check if the node has auto layout
  if (node.layoutMode === 'NONE') {
    throw new Error(`Node does not have auto layout enabled`);
  }

  // Store original values
  const originalPrimary = node.primaryAxisSizingMode;
  const originalCounter = node.counterAxisSizingMode;

  // Update the sizing modes
  if (primaryAxisSizingMode) {
    node.primaryAxisSizingMode = primaryAxisSizingMode;
  }

  if (counterAxisSizingMode) {
    node.counterAxisSizingMode = counterAxisSizingMode;
  }

  // If resizeChildren is true, adjust constraints and sizes of children based on the new sizing modes
  if (resizeChildren && 'children' in node && node.children.length > 0) {
    // Apply sizing constraints to children based on the layout direction and sizing modes
    const isHorizontal = node.layoutMode === 'HORIZONTAL';
    
    // Determine which axis is affected by which sizing mode
    const xAxisSizingMode = isHorizontal ? primaryAxisSizingMode : counterAxisSizingMode;
    const yAxisSizingMode = isHorizontal ? counterAxisSizingMode : primaryAxisSizingMode;
    
    // Apply constraints to children
    node.children.forEach(child => {
      if ('constraints' in child) {
        // X-axis constraints
        if (xAxisSizingMode === 'HUG') {
          // When parent hugs content, children should not stretch
          child.constraints = {
            ...child.constraints,
            horizontal: 'MIN'
          };
        } else if (xAxisSizingMode === 'FIXED') {
          // For fixed width, depends on the layout
          if (isHorizontal) {
            // In horizontal layout, children should remain fixed width
            child.constraints = {
              ...child.constraints,
              horizontal: 'MIN'
            };
          } else {
            // In vertical layout, children can stretch to fill width
            child.constraints = {
              ...child.constraints,
              horizontal: 'STRETCH'
            };
          }
        }
        
        // Y-axis constraints
        if (yAxisSizingMode === 'HUG') {
          // When parent hugs content, children should not stretch
          child.constraints = {
            ...child.constraints,
            vertical: 'MIN'
          };
        } else if (yAxisSizingMode === 'FIXED') {
          // For fixed height, depends on the layout
          if (!isHorizontal) {
            // In vertical layout, children should remain fixed height
            child.constraints = {
              ...child.constraints,
              vertical: 'MIN'
            };
          } else {
            // In horizontal layout, children can stretch to fill height
            child.constraints = {
              ...child.constraints,
              vertical: 'STRETCH'
            };
          }
        }
      }
    });
  }

  // Return the updated settings
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    layoutMode: node.layoutMode,
    previousSettings: {
      primaryAxisSizingMode: originalPrimary,
      counterAxisSizingMode: originalCounter
    },
    currentSettings: {
      primaryAxisSizingMode: node.primaryAxisSizingMode,
      counterAxisSizingMode: node.counterAxisSizingMode
    },
    childrenAdjusted: resizeChildren && 'children' in node ? node.children.length : 0
  };
}

// Toggle auto layout direction between horizontal and vertical
function toggleAutoLayoutDirection(params) {
  const { nodeId } = params;

  // Get the node
  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  // Check if the node has auto layout
  if (node.layoutMode === 'NONE') {
    throw new Error(`Node does not have auto layout enabled`);
  }

  // Store the current properties before toggling
  const currentDirection = node.layoutMode;
  const currentSpacing = node.itemSpacing;
  const currentPaddingTop = node.paddingTop;
  const currentPaddingRight = node.paddingRight;
  const currentPaddingBottom = node.paddingBottom;
  const currentPaddingLeft = node.paddingLeft;
  const currentPrimaryAxisAlign = node.primaryAxisAlignItems;
  const currentCounterAxisAlign = node.counterAxisAlignItems;
  const currentPrimaryAxisSizingMode = node.primaryAxisSizingMode;
  const currentCounterAxisSizingMode = node.counterAxisSizingMode;

  // Toggle the layout direction
  const newDirection = currentDirection === 'HORIZONTAL' ? 'VERTICAL' : 'HORIZONTAL';
  node.layoutMode = newDirection;

  // Maintain the same properties after toggling
  node.itemSpacing = currentSpacing;
  node.paddingTop = currentPaddingTop;
  node.paddingRight = currentPaddingRight;
  node.paddingBottom = currentPaddingBottom;
  node.paddingLeft = currentPaddingLeft;
  
  // Intelligently swap primary and counter axis properties
  node.primaryAxisAlignItems = currentCounterAxisAlign !== 'BASELINE' ? 
                               currentCounterAxisAlign : 
                               currentPrimaryAxisAlign;
                               
  node.counterAxisAlignItems = currentPrimaryAxisAlign !== 'SPACE_BETWEEN' ? 
                               currentPrimaryAxisAlign : 
                               currentCounterAxisAlign;
  
  // Swap sizing modes as well if needed
  node.primaryAxisSizingMode = currentCounterAxisSizingMode;
  node.counterAxisSizingMode = currentPrimaryAxisSizingMode;

  // Return the updated properties
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    previousDirection: currentDirection,
    newDirection: newDirection,
    layoutMode: node.layoutMode,
    itemSpacing: node.itemSpacing,
    padding: {
      top: node.paddingTop,
      right: node.paddingRight,
      bottom: node.paddingBottom,
      left: node.paddingLeft
    },
    primaryAxisAlignItems: node.primaryAxisAlignItems,
    counterAxisAlignItems: node.counterAxisAlignItems,
    primaryAxisSizingMode: node.primaryAxisSizingMode,
    counterAxisSizingMode: node.counterAxisSizingMode
  };
}

// Get information about the current selection
function getSelection() {
  return figma.currentPage.selection.map(node => ({
    id: node.id,
    name: node.name,
    type: node.type,
    x: 'x' in node ? node.x : null,
    y: 'y' in node ? node.y : null,
    width: 'width' in node ? node.width : null,
    height: 'height' in node ? node.height : null
  }));
}

// Get detailed node information (recursive)
function readMyDesign() {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    throw new Error('No selection found. Please select a node.');
  }

  return selection.map(node => getNodeDetails(node));
}

// Get detailed information about a specific node
function getNodeInfo(nodeId) {
  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  return getNodeDetails(node);
}

// Get detailed information about multiple nodes
function getNodesInfo(nodeIds) {
  return nodeIds.map(nodeId => {
    try {
      return getNodeInfo(nodeId);
    } catch (error) {
      return { id: nodeId, error: error.message };
    }
  });
}

// Helper function to get node details recursively
function getNodeDetails(node, depth = 0, maxDepth = 5) {
  // Basic node information
  const details = {
    id: node.id,
    name: node.name,
    type: node.type,
    visible: node.visible
  };

  // Add positioning and sizing if available
  if ('x' in node) details.x = node.x;
  if ('y' in node) details.y = node.y;
  if ('width' in node) details.width = node.width;
  if ('height' in node) details.height = node.height;

  // Add text content if it's a text node
  if (node.type === 'TEXT') {
    details.characters = node.characters;
    details.fontSize = node.fontSize;
    details.fontName = node.fontName;
  }

  // Add fills if available
  if ('fills' in node && node.fills) {
    details.fills = node.fills;
  }

  // Add strokes if available
  if ('strokes' in node && node.strokes) {
    details.strokes = node.strokes;
  }

  // Add component information if applicable
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    if (node.type === 'INSTANCE' && node.mainComponent) {
      details.mainComponent = {
        id: node.mainComponent.id,
        name: node.mainComponent.name
      };
    }
  }

  // Add layout properties if applicable
  if ('layoutMode' in node) {
    details.layoutMode = node.layoutMode;
    details.paddingLeft = node.paddingLeft;
    details.paddingRight = node.paddingRight;
    details.paddingTop = node.paddingTop;
    details.paddingBottom = node.paddingBottom;
    details.itemSpacing = node.itemSpacing;
    details.counterAxisAlignItems = node.counterAxisAlignItems;
    details.primaryAxisAlignItems = node.primaryAxisAlignItems;
  }

  // Recursively add children if the node has children and we haven't reached max depth
  if ('children' in node && node.children && depth < maxDepth) {
    details.children = node.children.map(child => getNodeDetails(child, depth + 1, maxDepth));
  }

  return details;
}

// Create a rectangle
function createRectangle(params) {
  const { x, y, width, height, name, parentId } = params;

  // Create the rectangle
  const rect = figma.createRectangle();
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);

  if (name) {
    rect.name = name;
  }

  // Add to parent if specified
  if (parentId) {
    const parent = figma.getNodeById(parentId);
    if (parent && 'appendChild' in parent) {
      parent.appendChild(rect);
    } else {
      throw new Error(`Invalid parent node: ${parentId}`);
    }
  } else {
    // Add to current page if no parent is specified
    figma.currentPage.appendChild(rect);
  }

  return {
    id: rect.id,
    name: rect.name,
    type: rect.type,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height
  };
}

// Create a frame
function createFrame(params) {
  const { x, y, width, height, name, parentId } = params;

  // Create the frame
  const frame = figma.createFrame();
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);

  if (name) {
    frame.name = name;
  }

  // Add to parent if specified
  if (parentId) {
    const parent = figma.getNodeById(parentId);
    if (parent && 'appendChild' in parent) {
      parent.appendChild(frame);
    } else {
      throw new Error(`Invalid parent node: ${parentId}`);
    }
  } else {
    // Add to current page if no parent is specified
    figma.currentPage.appendChild(frame);
  }

  return {
    id: frame.id,
    name: frame.name,
    type: frame.type,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height
  };
}

// Create a frame with auto layout properties
function createFrameWithAutoLayout(params) {
  const { 
    x, y, width, height, name, parentId,
    // Auto layout parameters
    layoutMode,                 // 'HORIZONTAL' or 'VERTICAL'
    itemSpacing = 0,            // Space between children
    padding = 0,                // Frame padding (number or object)
    primaryAxisAlignItems = 'MIN',    // 'MIN', 'CENTER', 'MAX', 'SPACE_BETWEEN'
    counterAxisAlignItems = 'MIN'     // 'MIN', 'CENTER', 'MAX', 'BASELINE'
  } = params;

  // Create the frame
  const frame = figma.createFrame();
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);

  if (name) {
    frame.name = name;
  }

  // Apply auto layout properties if specified
  if (layoutMode) {
    frame.layoutMode = layoutMode;
    frame.itemSpacing = itemSpacing;
    frame.primaryAxisAlignItems = primaryAxisAlignItems;
    frame.counterAxisAlignItems = counterAxisAlignItems;
    
    // Apply padding
    if (typeof padding === 'number') {
      // Uniform padding
      frame.paddingTop = padding;
      frame.paddingRight = padding;
      frame.paddingBottom = padding;
      frame.paddingLeft = padding;
    } else if (typeof padding === 'object') {
      // Individual padding values
      if (padding.top !== undefined) frame.paddingTop = padding.top;
      if (padding.right !== undefined) frame.paddingRight = padding.right;
      if (padding.bottom !== undefined) frame.paddingBottom = padding.bottom;
      if (padding.left !== undefined) frame.paddingLeft = padding.left;
    }
  }

  // Add to parent if specified
  if (parentId) {
    const parent = figma.getNodeById(parentId);
    if (parent && 'appendChild' in parent) {
      parent.appendChild(frame);
    } else {
      throw new Error(`Invalid parent node: ${parentId}`);
    }
  } else {
    // Add to current page if no parent is specified
    figma.currentPage.appendChild(frame);
  }

  return {
    id: frame.id,
    name: frame.name,
    type: frame.type,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    // Auto layout properties
    layoutMode: layoutMode || null,
    itemSpacing: layoutMode ? frame.itemSpacing : null,
    padding: layoutMode ? {
      top: frame.paddingTop,
      right: frame.paddingRight,
      bottom: frame.paddingBottom,
      left: frame.paddingLeft
    } : null,
    primaryAxisAlignItems: layoutMode ? frame.primaryAxisAlignItems : null,
    counterAxisAlignItems: layoutMode ? frame.counterAxisAlignItems : null
  };
}

// Modify auto layout properties of an existing frame
function modifyAutoLayout(params) {
  const { 
    nodeId,
    layoutMode,                 // 'HORIZONTAL', 'VERTICAL', or null (remove auto layout)
    itemSpacing,
    padding,
    primaryAxisAlignItems,
    counterAxisAlignItems,
    primaryAxisSizingMode,     // 'FIXED', 'AUTO', or 'HUG'
    counterAxisSizingMode      // 'FIXED', 'AUTO', or 'HUG'
  } = params;

  // Get the node
  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  // Check if the node is a frame, component, component set, instance, or section
  const validTypes = ['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION'];
  if (!validTypes.includes(node.type)) {
    throw new Error(`Node of type ${node.type} does not support auto layout`);
  }

  // Update auto layout properties
  if (layoutMode === null) {
    // Remove auto layout
    node.layoutMode = 'NONE';
  } else if (layoutMode) {
    // Set or modify auto layout
    node.layoutMode = layoutMode;

    // Update spacing if specified
    if (itemSpacing !== undefined) {
      node.itemSpacing = itemSpacing;
    }

    // Update padding if specified
    if (padding !== undefined) {
      if (typeof padding === 'number') {
        // Uniform padding
        node.paddingTop = padding;
        node.paddingRight = padding;
        node.paddingBottom = padding;
        node.paddingLeft = padding;
      } else if (typeof padding === 'object') {
        // Individual padding values
        if (padding.top !== undefined) node.paddingTop = padding.top;
        if (padding.right !== undefined) node.paddingRight = padding.right;
        if (padding.bottom !== undefined) node.paddingBottom = padding.bottom;
        if (padding.left !== undefined) node.paddingLeft = padding.left;
      }
    }

    // Update alignments if specified
    if (primaryAxisAlignItems !== undefined) {
      node.primaryAxisAlignItems = primaryAxisAlignItems;
    }

    if (counterAxisAlignItems !== undefined) {
      node.counterAxisAlignItems = counterAxisAlignItems;
    }

    // Update sizing modes if specified
    if (primaryAxisSizingMode !== undefined) {
      node.primaryAxisSizingMode = primaryAxisSizingMode;
    }

    if (counterAxisSizingMode !== undefined) {
      node.counterAxisSizingMode = counterAxisSizingMode;
    }
  }

  // Return the updated node properties
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    layoutMode: node.layoutMode,
    itemSpacing: node.layoutMode !== 'NONE' ? node.itemSpacing : null,
    padding: node.layoutMode !== 'NONE' ? {
      top: node.paddingTop,
      right: node.paddingRight,
      bottom: node.paddingBottom,
      left: node.paddingLeft
    } : null,
    primaryAxisAlignItems: node.layoutMode !== 'NONE' ? node.primaryAxisAlignItems : null,
    counterAxisAlignItems: node.layoutMode !== 'NONE' ? node.counterAxisAlignItems : null,
    primaryAxisSizingMode: node.layoutMode !== 'NONE' ? node.primaryAxisSizingMode : null,
    counterAxisSizingMode: node.layoutMode !== 'NONE' ? node.counterAxisSizingMode : null
  };
}

// Create a text node
async function createText(params) {
  const { x, y, text, fontSize, fontName, name, parentId } = params;

  // Create the text node
  const textNode = figma.createText();
  textNode.x = x;
  textNode.y = y;

  // Set text content and properties
  if (fontName) {
    await figma.loadFontAsync(fontName);
    textNode.fontName = fontName;
  } else {
    // Load a default font
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  }

  if (fontSize) {
    textNode.fontSize = fontSize;
  }

  textNode.characters = text;

  if (name) {
    textNode.name = name;
  }

  // Add to parent if specified
  if (parentId) {
    const parent = figma.getNodeById(parentId);
    if (parent && 'appendChild' in parent) {
      parent.appendChild(textNode);
    } else {
      throw new Error(`Invalid parent node: ${parentId}`);
    }
  } else {
    // Add to current page if no parent is specified
    figma.currentPage.appendChild(textNode);
  }

  return {
    id: textNode.id,
    name: textNode.name,
    type: textNode.type,
    x: textNode.x,
    y: textNode.y,
    width: textNode.width,
    height: textNode.height,
    characters: textNode.characters
  };
}

// Scan text nodes
async function scanTextNodes(params) {
  const { nodeId, recursive = true, chunkSize = 50 } = params;

  // Get the node to scan
  let targetNode;
  if (nodeId) {
    targetNode = figma.getNodeById(nodeId);
    if (!targetNode) {
      throw new Error(`Node not found: ${nodeId}`);
    }
  } else if (figma.currentPage.selection.length > 0) {
    targetNode = figma.currentPage.selection[0];
  } else {
    targetNode = figma.currentPage;
  }

  // Find all text nodes
  const textNodes = [];

  function collectTextNodes(node) {
    if (node.type === 'TEXT') {
      textNodes.push({
        id: node.id,
        name: node.name,
        characters: node.characters,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        fontSize: node.fontSize,
        fontName: node.fontName
      });
    }

    if (recursive && 'children' in node) {
      for (const child of node.children) {
        collectTextNodes(child);
      }
    }
  }

  collectTextNodes(targetNode);

  // Split into chunks if needed
  const chunks = [];
  for (let i = 0; i < textNodes.length; i += chunkSize) {
    chunks.push(textNodes.slice(i, i + chunkSize));
  }

  return {
    totalCount: textNodes.length,
    chunks: chunks.length,
    textNodes: textNodes
  };
}

// Set text content for a single node
async function setTextContent(nodeId, text) {
  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (node.type !== 'TEXT') {
    throw new Error(`Node is not a text node: ${nodeId}`);
  }

  // Load the font
  await figma.loadFontAsync(node.fontName);

  // Set the text
  node.characters = text;

  return {
    id: node.id,
    name: node.name,
    characters: node.characters
  };
}

// Set text content for multiple nodes
async function setMultipleTextContents(updates) {
  const results = [];

  for (const update of updates) {
    try {
      const result = await setTextContent(update.nodeId, update.text);
      results.push(result);
    } catch (error) {
      results.push({
        id: update.nodeId,
        error: error.message
      });
    }
  }

  return results;
}

// Set fill color for a node (enhanced with gradient support)
function setFillColor(params) {
  const { nodeId, fills } = params;

  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!('fills' in node)) {
    throw new Error(`Node does not support fills: ${nodeId}`);
  }

  // Process the fills array
  const figmaFills = fills.map(fill => {
    if (fill.type === 'SOLID') {
      return {
        type: 'SOLID',
        color: fill.color,
        opacity: fill.opacity !== undefined ? fill.opacity : 1
      };
    } else if (fill.type === 'LINEAR_GRADIENT' || fill.type === 'RADIAL_GRADIENT') {
      // Create gradient paint
      const gradientPaint = {
        type: 'GRADIENT_' + fill.type.split('_')[0], // Convert LINEAR_GRADIENT to GRADIENT_LINEAR
        gradientStops: fill.gradientStops.map(stop => ({
          position: stop.position,
          color: {
            r: stop.color.r,
            g: stop.color.g,
            b: stop.color.b,
            a: stop.color.a !== undefined ? stop.color.a : 1
          }
        })),
        opacity: fill.opacity !== undefined ? fill.opacity : 1
      };

      // Set gradient transform if provided, otherwise use default
      if (fill.gradientTransform) {
        gradientPaint.gradientTransform = fill.gradientTransform;
      } else {
        // Default gradient transform (diagonal)
        gradientPaint.gradientTransform = [[1, 0, 0], [0, 1, 0]];
      }

      return gradientPaint;
    }

    return fill;
  });

  // Set the fills
  node.fills = figmaFills;

  return {
    id: node.id,
    name: node.name,
    fills: node.fills
  };
}

// Set corner radius for a node
function setCornerRadius(params) {
  const { nodeId, radius } = params;

  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!('cornerRadius' in node)) {
    throw new Error(`Node does not support corner radius: ${nodeId}`);
  }

  if (typeof radius === 'number') {
    // Uniform radius
    node.cornerRadius = radius;
  } else if (typeof radius === 'object') {
    // Individual corners
    if ('topLeftRadius' in node && 'topRightRadius' in node && 
        'bottomLeftRadius' in node && 'bottomRightRadius' in node) {
      node.topLeftRadius = radius.topLeft || 0;
      node.topRightRadius = radius.topRight || 0;
      node.bottomRightRadius = radius.bottomRight || 0;
      node.bottomLeftRadius = radius.bottomLeft || 0;
    } else {
      throw new Error('Node does not support individual corner radius');
    }
  }

  return {
    id: node.id,
    name: node.name,
    cornerRadius: node.cornerRadius,
    topLeftRadius: node.topLeftRadius,
    topRightRadius: node.topRightRadius,
    bottomRightRadius: node.bottomRightRadius,
    bottomLeftRadius: node.bottomLeftRadius
  };
}

// Set stroke properties for a node
function setStroke(params) {
  const { nodeId, strokes } = params;

  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!('strokes' in node)) {
    throw new Error(`Node does not support strokes: ${nodeId}`);
  }

  // Process the strokes array
  const figmaStrokes = strokes.map(stroke => {
    const figmaStroke = {
      type: stroke.type,
      opacity: stroke.opacity !== undefined ? stroke.opacity : 1
    };

    if (stroke.type === 'SOLID') {
      figmaStroke.color = stroke.color;
    }

    return figmaStroke;
  });

  // Set strokes
  node.strokes = figmaStrokes;

  // Set stroke weight
  if (strokes.length > 0 && strokes[0].weight !== undefined) {
    node.strokeWeight = strokes[0].weight;
  }

  // Set stroke align
  if (strokes.length > 0 && strokes[0].strokeAlign) {
    node.strokeAlign = strokes[0].strokeAlign;
  }

  // Set dash pattern
  if (strokes.length > 0 && strokes[0].dashPattern) {
    node.dashPattern = strokes[0].dashPattern;
  }

  // Set stroke cap
  if (strokes.length > 0 && strokes[0].strokeCap && 'strokeCap' in node) {
    node.strokeCap = strokes[0].strokeCap;
  }

  // Set stroke join
  if (strokes.length > 0 && strokes[0].strokeJoin && 'strokeJoin' in node) {
    node.strokeJoin = strokes[0].strokeJoin;
  }

  return {
    id: node.id,
    name: node.name,
    strokes: node.strokes,
    strokeWeight: node.strokeWeight,
    strokeAlign: node.strokeAlign
  };
}

// Set effects for a node
function setEffects(params) {
  const { nodeId, effects } = params;

  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  if (!('effects' in node)) {
    throw new Error(`Node does not support effects: ${nodeId}`);
  }

  // Process the effects array
  const figmaEffects = effects.map(effect => {
    // Handle different effect types based on Figma's API
    switch (effect.type) {
      case 'DROP_SHADOW':
      case 'INNER_SHADOW':
        return {
          type: effect.type,
          visible: effect.visible !== undefined ? effect.visible : true,
          blendMode: effect.blendMode || 'NORMAL',
          color: {
            r: effect.color.r,
            g: effect.color.g,
            b: effect.color.b,
            a: effect.color.a !== undefined ? effect.color.a : 1
          },
          offset: effect.offset || { x: 0, y: 0 },
          radius: effect.radius || 0,
          spread: effect.spread || 0
        };
        
      case 'LAYER_BLUR':
      case 'BACKGROUND_BLUR':
        return {
          type: effect.type,
          visible: effect.visible !== undefined ? effect.visible : true,
          radius: effect.radius || 0
        };
        
      default:
        // Return the effect as-is for unknown types
        return effect;
    }
  });

  // Set the effects
  node.effects = figmaEffects;

  return {
    id: node.id,
    name: node.name,
    effects: node.effects
  };
}

// Get information about components
function getLocalComponents() {
  // Get all local components in the document
  const components = [];

  // Process each page
  for (const page of figma.root.children) {
    // Function to find components recursively
    function findComponents(node) {
      if (node.type === 'COMPONENT') {
        components.push({
          id: node.id,
          name: node.name,
          description: node.description,
          pageName: page.name,
          width: node.width,
          height: node.height
        });
      }

      if ('children' in node) {
        for (const child of node.children) {
          findComponents(child);
        }
      }
    }

    // Start finding components from the page
    findComponents(page);
  }

  return {
    count: components.length,
    components
  };
}

// Get detailed component data for a specific component by ID
async function getComponentData(params) {
  const { componentId, includeStyles = false, includeVariants = true, includeThumbnail = true } = params;
  
  // Get the component
  const component = figma.getNodeById(componentId);
  
  if (!component) {
    throw new Error(`Component with ID ${componentId} not found`);
  }
  
  if (component.type !== 'COMPONENT' && component.type !== 'COMPONENT_SET') {
    throw new Error(`Node ${componentId} is not a component or component set`);
  }
  
  const result = {
    id: component.id,
    name: component.name,
    type: component.type,
    description: component.description || '',
    key: component.key,
    width: component.width,
    height: component.height,
    remote: component.remote || false,
  };
  
  // Find the page the component is on
  let parentNode = component.parent;
  while (parentNode && parentNode.type !== 'PAGE') {
    parentNode = parentNode.parent;
  }
  
  if (parentNode && parentNode.type === 'PAGE') {
    result.pageName = parentNode.name;
  }
  
  // Add component properties
  if (component.type === 'COMPONENT') {
    result.componentProperties = component.componentPropertyDefinitions || {};
    
    // Add style information if requested
    if (includeStyles) {
      result.styles = {};
      
      // Extract fill styles
      if ('fills' in component && component.fills.length > 0) {
        result.styles.fills = component.fills;
      }
      
      // Extract stroke styles
      if ('strokes' in component && component.strokes.length > 0) {
        result.styles.strokes = component.strokes;
      }
      
      // Extract effect styles
      if ('effects' in component && component.effects.length > 0) {
        result.styles.effects = component.effects;
      }
      
      // Check for text-specific styles
      if (component.type === 'TEXT') {
        result.styles.fontSize = component.fontSize;
        result.styles.fontName = component.fontName;
        result.styles.textAlignHorizontal = component.textAlignHorizontal;
        result.styles.textAlignVertical = component.textAlignVertical;
      }
      
      // Check for auto layout properties
      if ('layoutMode' in component && component.layoutMode !== 'NONE') {
        result.styles.autoLayout = {
          layoutMode: component.layoutMode,
          itemSpacing: component.itemSpacing,
          paddingTop: component.paddingTop,
          paddingRight: component.paddingRight,
          paddingBottom: component.paddingBottom,
          paddingLeft: component.paddingLeft,
          primaryAxisAlignItems: component.primaryAxisAlignItems,
          counterAxisAlignItems: component.counterAxisAlignItems,
          primaryAxisSizingMode: component.primaryAxisSizingMode,
          counterAxisSizingMode: component.counterAxisSizingMode
        };
      }
    }
  }
  
  // For component sets, include variant information if requested
  if (component.type === 'COMPONENT_SET' && includeVariants) {
    // Get all variants in the set
    const variants = component.children.filter(child => child.type === 'COMPONENT');
    
    result.variantProperties = component.variantGroupProperties || {};
    result.variants = variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      componentProperties: variant.componentPropertyDefinitions || {},
      variantProperties: extractVariantProperties(variant.name)
    }));
  }
  
  // Generate thumbnail if requested
  if (includeThumbnail) {
    try {
      // Export a small thumbnail of the component
      const bytes = await component.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      });
      
      // Convert to base64
      result.thumbnail = figma.base64Encode(bytes);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      result.thumbnailError = error.message;
    }
  }
  
  return result;
}

// Get enhanced component library with more details and filtering options
async function getEnhancedComponentLibrary(params) {
  const { 
    includeRemote = true,        // Include components from team libraries
    includeLocal = true,         // Include local components
    includeThumbnails = true,    // Include thumbnails for visual browsing
    categoryFilter = null,       // Filter by category (from component name e.g., "Buttons/Primary")
    searchQuery = '',            // Search component names and descriptions
    pageFilter = null,           // Filter by page name
    sortBy = 'name',             // Sort by: 'name', 'updated', 'page', or 'category'
    limit = 100                  // Maximum number of components to return
  } = params;
  
  // Collect all components that match the criteria
  const allComponents = [];
  let remoteComponents = [];
  
  // Get local components if requested
  if (includeLocal) {
    // Process each page in the current document
    for (const page of figma.root.children) {
      // Skip page if a page filter is specified and doesn't match
      if (pageFilter && page.name !== pageFilter) {
        continue;
      }
      
      // Function to find components recursively
      function findComponents(node) {
        if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
          // Skip if doesn't match search query
          if (searchQuery && 
              !node.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
              !(node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
            return;
          }
          
          // Skip if doesn't match category filter
          if (categoryFilter) {
            const category = extractComponentCategory(node.name);
            if (category !== categoryFilter) {
              return;
            }
          }
          
          // Component passed all filters, add it
          allComponents.push({
            id: node.id,
            name: node.name,
            type: node.type,
            description: node.description || '',
            pageName: page.name,
            key: node.key,
            remote: false,
            category: extractComponentCategory(node.name),
            lastModified: node.lastModified ? new Date(node.lastModified).toISOString() : null,
            width: node.width,
            height: node.height,
            variantCount: node.type === 'COMPONENT_SET' ? node.children.length : 0
          });
        }
        
        // Recursively search children
        if ('children' in node) {
          for (const child of node.children) {
            findComponents(child);
          }
        }
      }
      
      // Start finding components from the page
      findComponents(page);
    }
  }
  
  // Get remote components if requested
  if (includeRemote) {
    try {
      // Get metadata for all available team components
      // This doesn't actually load the components
      const teamLibraries = await Promise.all(
        figma.teamLibrary.getAvailableTeamLibrariesAsync()
      );
      
      // Extract remote component info
      for (const library of teamLibraries) {
        // Skip if doesn't match search query or category
        if ((searchQuery && !library.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (categoryFilter && !library.name.includes(categoryFilter))) {
          continue;
        }
        
        remoteComponents.push({
          id: library.key,  // We don't have the actual ID until we load it
          name: library.name,
          type: 'REMOTE_COMPONENT_LIBRARY',
          description: '',
          libraryName: library.name,
          key: library.key,
          remote: true,
          category: extractComponentCategory(library.name),
          lastModified: library.lastModified ? new Date(library.lastModified).toISOString() : null
        });
      }
      
      // Add remote components to the list
      allComponents.push(...remoteComponents);
    } catch (error) {
      console.error('Error fetching remote components:', error);
    }
  }
  
  // Sort the components
  sortComponents(allComponents, sortBy);
  
  // Apply limit
  const limitedComponents = allComponents.slice(0, limit);
  
  // Generate thumbnails if requested
  if (includeThumbnails) {
    for (const component of limitedComponents) {
      // Skip remote components or if the component is a library
      if (component.remote || component.type === 'REMOTE_COMPONENT_LIBRARY') {
        continue;
      }
      
      try {
        const node = figma.getNodeById(component.id);
        if (node) {
          // Export a small thumbnail
          const bytes = await node.exportAsync({
            format: 'PNG',
            constraint: { type: 'SCALE', value: 0.5 }
          });
          
          // Convert to base64
          component.thumbnail = figma.base64Encode(bytes);
        }
      } catch (error) {
        console.error(`Error generating thumbnail for component ${component.id}:`, error);
      }
    }
  }
  
  // Return the final result
  return {
    count: limitedComponents.length,
    totalAvailable: allComponents.length,
    local: limitedComponents.filter(c => !c.remote).length,
    remote: limitedComponents.filter(c => c.remote).length,
    components: limitedComponents
  };
}

// Helper function to extract category from component name (e.g., "Buttons/Primary/Default" -> "Buttons")
function extractComponentCategory(name) {
  if (!name) return '';
  
  // If the name includes a slash, the category is everything before the first slash
  const parts = name.split('/');
  if (parts.length > 1) {
    return parts[0].trim();
  }
  
  // Otherwise, try to extract a general category
  const commonCategories = [
    'Button', 'Card', 'Input', 'Modal', 'Nav', 'Menu', 'Header', 'Footer',
    'Icon', 'Image', 'Typography', 'Form', 'Table', 'List', 'Dialog', 'Dropdown'
  ];
  
  // Check if the name starts with any of the common categories
  for (const category of commonCategories) {
    if (name.startsWith(category) || name.includes(category)) {
      return category;
    }
  }
  
  return ''; // No category found
}

// Helper function to extract variant properties from component name
function extractVariantProperties(name) {
  const result = {};
  
  if (!name || !name.includes('=')) {
    return result;
  }
  
  // Component variant names follow the pattern: "Component Name, Prop1=Value1, Prop2=Value2"
  const parts = name.split(',');
  
  // Skip the first part (component name) and process the rest
  for (let i = 1; i < parts.length; i++) {
    const propPart = parts[i].trim();
    const [propName, propValue] = propPart.split('=').map(p => p.trim());
    
    if (propName && propValue) {
      result[propName] = propValue;
    }
  }
  
  return result;
}

// Helper function to sort components
function sortComponents(components, sortBy) {
  switch (sortBy) {
    case 'name':
      components.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'updated':
      components.sort((a, b) => {
        if (!a.lastModified) return 1;
        if (!b.lastModified) return -1;
        return new Date(b.lastModified) - new Date(a.lastModified);
      });
      break;
    case 'page':
      components.sort((a, b) => {
        if (!a.pageName) return 1;
        if (!b.pageName) return -1;
        return a.pageName.localeCompare(b.pageName);
      });
      break;
    case 'category':
      components.sort((a, b) => {
        if (!a.category) return 1;
        if (!b.category) return -1;
        return a.category.localeCompare(b.category);
      });
      break;
    case 'type':
      components.sort((a, b) => {
        if (a.remote && !b.remote) return 1;
        if (!a.remote && b.remote) return -1;
        return a.name.localeCompare(b.name);
      });
      break;
    default:
      // Default to sorting by name
      components.sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Create an instance of a component
async function createComponentInstance(params) {
  const { componentId, x, y, name, parentId } = params;

  try {
    // Get the component
    const component = figma.getNodeById(componentId);

    if (!component) {
      throw new Error(`Node with ID ${componentId} not found`);
    }

    if (component.type !== 'COMPONENT') {
      // Provide more helpful error message
      if (component.type === 'INSTANCE') {
        throw new Error(`Node ${componentId} is an instance, not a component. Use its mainComponent ID instead.`);
      }
      throw new Error(`Node ${componentId} is of type ${component.type}, not a COMPONENT`);
    }

    // Create the instance
    const instance = component.createInstance();
    instance.x = x;
    instance.y = y;

    if (name) {
      instance.name = name;
    }

    // Add to parent if specified
    if (parentId) {
      const parent = figma.getNodeById(parentId);
      if (parent && 'appendChild' in parent) {
        parent.appendChild(instance);
      } else {
        throw new Error(`Invalid parent node: ${parentId}`);
      }
    } else {
      // Add to current page if no parent is specified
      figma.currentPage.appendChild(instance);
    }

    return {
      id: instance.id,
      name: instance.name,
      type: instance.type,
      x: instance.x,
      y: instance.y,
      width: instance.width,
      height: instance.height,
      mainComponent: {
        id: instance.mainComponent.id,
        name: instance.mainComponent.name
      }
    };
  } catch (error) {
    throw new Error(`Failed to create component instance: ${error.message}`);
  }
}

// Export a node as an image
async function exportNodeAsImage(params) {
  const { nodeId, format = 'PNG', scale = 1 } = params;

  const node = figma.getNodeById(nodeId);

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }

  // Set export settings
  const settings = {
    format: format.toLowerCase(),
    constraint: { type: 'SCALE', value: scale }
  };

  // Get the export data
  const bytes = await node.exportAsync(settings);

  // Convert to base64 (this is a simplification, actual implementation would be different)
  const base64 = figma.base64Encode(bytes);

  return {
    id: node.id,
    name: node.name,
    format,
    scale,
    base64
  };
}

// Create an image from a URL
async function createImageFromUrl(params) {
  const { imageUrl, x, y, width, height, name, parentId } = params;

  try {
    // Create the image in Figma from the URL
    const image = await figma.createImageAsync(imageUrl);
    
    // Create a rectangle to hold the image
    const rect = figma.createRectangle();
    rect.x = x;
    rect.y = y;
    rect.resize(width, height);
    
    if (name) {
      rect.name = name;
    }
    
    // Apply the image as a fill
    rect.fills = [{
      type: 'IMAGE',
      scaleMode: 'FILL',
      imageHash: image.hash
    }];
    
    // Add to parent if specified
    if (parentId) {
      const parent = figma.getNodeById(parentId);
      if (parent && 'appendChild' in parent) {
        parent.appendChild(rect);
      } else {
        throw new Error(`Invalid parent node: ${parentId}`);
      }
    } else {
      // Add to current page if no parent is specified
      figma.currentPage.appendChild(rect);
    }
    
    return {
      id: rect.id,
      name: rect.name,
      type: rect.type,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      imageHash: image.hash
    };
  } catch (error) {
    if (error.message.includes('CORS')) {
      throw new Error(`CORS error: Unable to load image from URL. The image must be hosted on a server that allows cross-origin requests.`);
    } else if (error.message.includes('size')) {
      throw new Error(`Image size error: Images must be less than 4096x4096 pixels.`);
    } else if (error.message.includes('format')) {
      throw new Error(`Image format error: Only PNG, JPG, and GIF formats are supported.`);
    } else {
      throw new Error(`Failed to create image: ${error.message}`);
    }
  }
}

// Set an image as a fill on a node
async function setImageFill(params) {
  const { nodeId, imageUrl, scaleMode = 'FILL' } = params;
  
  const node = figma.getNodeById(nodeId);
  
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  
  if (!('fills' in node)) {
    throw new Error(`Node does not support fills: ${nodeId}`);
  }
  
  try {
    // Create the image from the URL
    const image = await figma.createImageAsync(imageUrl);
    
    // Create the image fill
    const imageFill = {
      type: 'IMAGE',
      scaleMode: scaleMode,
      imageHash: image.hash
    };
    
    // Set the fill
    node.fills = [imageFill];
    
    return {
      id: node.id,
      name: node.name,
      imageHash: image.hash,
      scaleMode: scaleMode,
      fills: node.fills
    };
  } catch (error) {
    if (error.message.includes('CORS')) {
      throw new Error(`CORS error: Unable to load image from URL. The image must be hosted on a server that allows cross-origin requests.`);
    } else if (error.message.includes('size')) {
      throw new Error(`Image size error: Images must be less than 4096x4096 pixels.`);
    } else if (error.message.includes('format')) {
      throw new Error(`Image format error: Only PNG, JPG, and GIF formats are supported.`);
    } else {
      throw new Error(`Failed to set image fill: ${error.message}`);
    }
  }
}

// Delete a node from the document
function deleteNode(params) {
  const { nodeId, safeMode = true } = params;
  
  // Get the node
  const node = figma.getNodeById(nodeId);
  
  if (!node) {
    throw new Error(`Node not found: ${nodeId}`);
  }
  
  // Safety checks in safe mode
  if (safeMode) {
    // Prevent deletion of document root
    if (node.type === 'DOCUMENT') {
      throw new Error('Cannot delete the document root');
    }
    
    // Prevent deletion of pages if it's the only page
    if (node.type === 'PAGE') {
      const pages = figma.root.children;
      if (pages.length <= 1) {
        throw new Error('Cannot delete the last remaining page');
      }
    }
  }
  
  // Store some information about the node before deletion
  const nodeInfo = {
    id: node.id,
    name: node.name,
    type: node.type,
    parent: node.parent ? {
      id: node.parent.id,
      name: node.parent.name,
      type: node.parent.type
    } : null
  };
  
  // Perform the deletion
  try {
    node.remove();
    
    return {
      success: true,
      message: `Successfully deleted node: ${nodeInfo.name}`,
      deletedNode: nodeInfo
    };
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('Removing this node is not allowed')) {
      if (node.type === 'INSTANCE' && node.parent && node.parent.type === 'INSTANCE') {
        throw new Error('Cannot delete child nodes of component instances. Instance children can only be hidden, not removed.');
      } else {
        throw new Error(`Cannot delete this ${node.type} node: ${error.message}`);
      }
    }
    
    throw new Error(`Failed to delete node: ${error.message}`);
  }
}

// Variable creation and management functions

// Create a new variable collection
function createVariableCollection(params) {
  const { name, modes = ['Default'] } = params;
  
  try {
    // Create the collection
    const collection = figma.variables.createVariableCollection(name);
    
    // Add additional modes
    for (let i = 1; i < modes.length; i++) {
      collection.addMode(modes[i]);
    }
    
    return {
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map(m => ({ id: m.modeId, name: m.name }))
    };
  } catch (error) {
    throw new Error(`Failed to create variable collection: ${error.message}`);
  }
}

// Create a new variable
function createVariable(params) {
  const { collectionId, name, type, value } = params;
  
  try {
    // Get the collection
    const collection = figma.variables.getVariableCollectionById(collectionId);
    if (!collection) {
      throw new Error(`Variable collection not found: ${collectionId}`);
    }
    
    // Map type names to Figma's variable types
    const typeMap = {
      'COLOR': 'COLOR',
      'NUMBER': 'FLOAT',
      'STRING': 'STRING',
      'BOOLEAN': 'BOOLEAN'
    };
    
    const figmaType = typeMap[type];
    if (!figmaType) {
      throw new Error(`Invalid variable type: ${type}`);
    }
    
    // Create the variable
    const variable = figma.variables.createVariable(name, collection, figmaType);
    
    // Set initial value if provided
    if (value !== undefined) {
      // Format color values properly for Figma
      let formattedValue = value;
      if (type === 'COLOR' && value) {
        // Normalize color values to 0-1 range as Figma expects
        formattedValue = {
          r: Math.max(0, Math.min(1, value.r || 0)),
          g: Math.max(0, Math.min(1, value.g || 0)),
          b: Math.max(0, Math.min(1, value.b || 0))
        };
        // Alpha is optional but should also be normalized if provided
        if (value.a !== undefined) {
          formattedValue.a = Math.max(0, Math.min(1, value.a));
        }
      }
      
      variable.setValueForMode(collection.defaultModeId, formattedValue);
    }
    
    return {
      id: variable.id,
      name: variable.name,
      type: variable.resolvedType
    };
  } catch (error) {
    throw new Error(`Failed to create variable: ${error.message}`);
  }
}

// Set a variable value for a specific mode
function setVariableModeValue(params) {
  const { variableId, modeId, value } = params;
  
  try {
    const variable = figma.variables.getVariableById(variableId);
    if (!variable) {
      throw new Error(`Variable not found: ${variableId}`);
    }
    
    variable.setValueForMode(modeId, value);
    
    return {
      id: variable.id,
      name: variable.name,
      type: variable.resolvedType,
      value: variable.valuesByMode[modeId]
    };
  } catch (error) {
    throw new Error(`Failed to set variable value: ${error.message}`);
  }
}

// Get all variable collections
function getAllVariableCollections() {
  try {
    const collections = figma.variables.getLocalVariableCollections();
    
    return collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      modes: collection.modes.map(m => ({ id: m.modeId, name: m.name })),
      variableCount: collection.variableIds.length
    }));
  } catch (error) {
    throw new Error(`Failed to get variable collections: ${error.message}`);
  }
}

// Get variables by collection
function getVariablesByCollection(params) {
  const { collectionId } = params;
  
  try {
    const collection = figma.variables.getVariableCollectionById(collectionId);
    if (!collection) {
      throw new Error(`Variable collection not found: ${collectionId}`);
    }
    
    const variables = collection.variableIds.map(id => {
      const variable = figma.variables.getVariableById(id);
      return {
        id: variable.id,
        name: variable.name,
        type: variable.resolvedType,
        valuesByMode: variable.valuesByMode
      };
    });
    
    return variables;
  } catch (error) {
    throw new Error(`Failed to get variables: ${error.message}`);
  }
}

// Import variables from JSON
function importVariablesFromJson(params) {
  const { jsonData } = params;
  
  try {
    const data = JSON.parse(jsonData);
    const results = [];
    
    for (const collectionData of data) {
      // Create collection
      const collection = figma.variables.createVariableCollection(collectionData.name);
      
      // Add modes
      for (let i = 1; i < collectionData.modes.length; i++) {
        collection.addMode(collectionData.modes[i]);
      }
      
      // Create variables
      for (const variableData of collectionData.variables) {
        const variable = figma.variables.createVariable(variableData.name, collection, variableData.type);
        
        // Set values for each mode
        if (variableData.modeValues) {
          for (const modeName in variableData.modeValues) {
            const mode = collection.modes.find(m => m.name === modeName);
            if (mode) {
              variable.setValueForMode(mode.modeId, variableData.modeValues[modeName]);
            }
          }
        }
      }
      
      results.push({
        collection: collection.name,
        variableCount: collectionData.variables.length
      });
    }
    
    return results;
  } catch (error) {
    throw new Error(`Failed to import variables: ${error.message}`);
  }
}

// Export variables to JSON
function exportVariablesToJson() {
  try {
    const collections = figma.variables.getLocalVariableCollections();
    const exportData = [];
    
    for (const collection of collections) {
      const collectionData = {
        name: collection.name,
        modes: collection.modes.map(m => m.name),
        variables: []
      };
      
      for (const variableId of collection.variableIds) {
        const variable = figma.variables.getVariableById(variableId);
        const variableData = {
          name: variable.name,
          type: variable.resolvedType,
          defaultValue: variable.valuesByMode[collection.defaultModeId],
          modeValues: {}
        };
        
        // Get values for all modes
        for (const mode of collection.modes) {
          variableData.modeValues[mode.name] = variable.valuesByMode[mode.modeId];
        }
        
        collectionData.variables.push(variableData);
      }
      
      exportData.push(collectionData);
    }
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    throw new Error(`Failed to export variables: ${error.message}`);
  }
}

// Create design tokens
function createDesignTokens() {
  try {
    // Create primitive tokens collection
    const primitives = figma.variables.createVariableCollection('Primitives');
    
    // Create color primitives
    const primaryColor = figma.variables.createVariable('color/primary', primitives, 'COLOR');
    primaryColor.setValueForMode(primitives.defaultModeId, { r: 0.2, g: 0.4, b: 1 });
    
    const secondaryColor = figma.variables.createVariable('color/secondary', primitives, 'COLOR');
    secondaryColor.setValueForMode(primitives.defaultModeId, { r: 0.5, g: 0.8, b: 0.3 });
    
    // Create spacing primitives
    const spacingSmall = figma.variables.createVariable('spacing/small', primitives, 'FLOAT');
    spacingSmall.setValueForMode(primitives.defaultModeId, 8);
    
    const spacingMedium = figma.variables.createVariable('spacing/medium', primitives, 'FLOAT');
    spacingMedium.setValueForMode(primitives.defaultModeId, 16);
    
    // Create semantic tokens collection with themes
    const semantic = figma.variables.createVariableCollection('Semantic');
    const darkMode = semantic.addMode('Dark');
    
    // Create semantic tokens that reference primitives
    const surfaceColor = figma.variables.createVariable('surface/background', semantic, 'COLOR');
    
    // Set different values for light and dark modes
    surfaceColor.setValueForMode(semantic.defaultModeId, { 
      type: 'VARIABLE_ALIAS', 
      id: primaryColor.id 
    });
    surfaceColor.setValueForMode(darkMode.modeId, { 
      type: 'VARIABLE_ALIAS', 
      id: secondaryColor.id 
    });
    
    return {
      message: 'Design tokens created successfully',
      primitives: {
        id: primitives.id,
        name: primitives.name,
        variableCount: primitives.variableIds.length
      },
      semantic: {
        id: semantic.id,
        name: semantic.name,
        modes: semantic.modes.map(m => m.name),
        variableCount: semantic.variableIds.length
      }
    };
  } catch (error) {
    throw new Error(`Failed to create design tokens: ${error.message}`);
  }
}

// Component creation and management functions

// Create a new component
function createComponent(params) {
  const { name, width, height, x = 0, y = 0 } = params;
  
  try {
    const component = figma.createComponent();
    component.name = name;
    component.resize(width, height);
    component.x = x;
    component.y = y;
    
    return {
      id: component.id,
      name: component.name,
      type: component.type,
      width: component.width,
      height: component.height
    };
  } catch (error) {
    throw new Error(`Failed to create component: ${error.message}`);
  }
}

// Convert existing node to component
function createComponentFromNode(params) {
  const { nodeId } = params;
  
  try {
    const node = figma.getNodeById(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    
    if (node.type !== 'FRAME' && node.type !== 'GROUP') {
      throw new Error('Only frames and groups can be converted to components');
    }
    
    const component = figma.createComponentFromNode(node);
    
    return {
      id: component.id,
      name: component.name,
      type: component.type,
      width: component.width,
      height: component.height
    };
  } catch (error) {
    throw new Error(`Failed to create component from node: ${error.message}`);
  }
}

// Add component property
function addComponentProperty(params) {
  const { componentId, propertyName, propertyType, defaultValue } = params;
  
  try {
    const component = figma.getNodeById(componentId);
    if (!component || component.type !== 'COMPONENT') {
      throw new Error(`Component not found: ${componentId}`);
    }
    
    const property = component.addComponentProperty(propertyName, propertyType, defaultValue);
    
    return {
      componentId: component.id,
      propertyName: property,
      propertyType: propertyType,
      defaultValue: defaultValue
    };
  } catch (error) {
    throw new Error(`Failed to add component property: ${error.message}`);
  }
}

// Create component set (variants)
function createComponentSet(params) {
  const { name, variants } = params;
  
  try {
    const components = [];
    
    // Create individual components for each variant
    for (const variant of variants) {
      const component = figma.createComponent();
      component.name = `${name} / ${variant.name}`;
      
      // Add variant properties as component properties
      for (const [key, value] of Object.entries(variant.properties || {})) {
        component.addComponentProperty(key, 'VARIANT', value);
      }
      
      components.push(component);
    }
    
    // Combine into component set
    const componentSet = figma.combineAsVariants(components, figma.currentPage);
    componentSet.name = name;
    
    return {
      id: componentSet.id,
      name: componentSet.name,
      type: componentSet.type,
      variantCount: components.length
    };
  } catch (error) {
    throw new Error(`Failed to create component set: ${error.message}`);
  }
}

// Align elements based on specified alignment type
function alignElements(params) {
  const { alignmentType, nodeIds, boundingBox } = params;
  
  try {
    // Get the nodes to align (either from nodeIds parameter or current selection)
    let nodes = [];
    
    if (nodeIds && nodeIds.length > 0) {
      // Get nodes from provided IDs
      nodes = nodeIds
        .map(id => figma.getNodeById(id))
        .filter(node => node && 'x' in node && 'y' in node && 'width' in node && 'height' in node);
    } else {
      // Use current selection
      nodes = figma.currentPage.selection
        .filter(node => 'x' in node && 'y' in node && 'width' in node && 'height' in node);
    }
    
    if (nodes.length === 0) {
      throw new Error('No valid nodes to align');
    }
    
    // Calculate reference bounding box (either from parameter or from nodes)
    let refBox;
    
    if (boundingBox) {
      // Use provided bounding box
      refBox = boundingBox;
    } else {
      // Calculate bounding box from nodes
      const minX = Math.min(...nodes.map(node => node.x));
      const minY = Math.min(...nodes.map(node => node.y));
      const maxX = Math.max(...nodes.map(node => node.x + node.width));
      const maxY = Math.max(...nodes.map(node => node.y + node.height));
      
      refBox = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    // Perform alignment based on alignmentType
    switch (alignmentType) {
      case 'LEFT':
        nodes.forEach(node => {
          node.x = refBox.x;
        });
        break;
        
      case 'RIGHT':
        nodes.forEach(node => {
          node.x = refBox.x + refBox.width - node.width;
        });
        break;
        
      case 'CENTER':
        nodes.forEach(node => {
          node.x = refBox.x + (refBox.width - node.width) / 2;
        });
        break;
        
      case 'TOP':
        nodes.forEach(node => {
          node.y = refBox.y;
        });
        break;
        
      case 'MIDDLE':
        nodes.forEach(node => {
          node.y = refBox.y + (refBox.height - node.height) / 2;
        });
        break;
        
      case 'BOTTOM':
        nodes.forEach(node => {
          node.y = refBox.y + refBox.height - node.height;
        });
        break;
        
      default:
        throw new Error(`Unknown alignment type: ${alignmentType}`);
    }
    
    // Return information about the aligned nodes
    return {
      success: true,
      alignmentType,
      nodeCount: nodes.length,
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        x: node.x,
        y: node.y
      })),
      referenceBoundingBox: refBox
    };
  } catch (error) {
    throw new Error(`Failed to align elements: ${error.message}`);
  }
}

// Distribute elements evenly
function distributeElements(params) {
  const { direction, nodeIds, spacing } = params;
  
  try {
    // Get the nodes to distribute (either from nodeIds parameter or current selection)
    let nodes = [];
    
    if (nodeIds && nodeIds.length > 0) {
      // Get nodes from provided IDs
      nodes = nodeIds
        .map(id => figma.getNodeById(id))
        .filter(node => node && 'x' in node && 'y' in node && 'width' in node && 'height' in node);
    } else {
      // Use current selection
      nodes = figma.currentPage.selection
        .filter(node => 'x' in node && 'y' in node && 'width' in node && 'height' in node);
    }
    
    if (nodes.length < 3) {
      throw new Error('Need at least 3 nodes to distribute. For 2 nodes, consider using alignment.');
    }
    
    // Sort nodes by position based on distribution direction
    if (direction === 'HORIZONTAL') {
      nodes.sort((a, b) => a.x - b.x);
    } else { // VERTICAL
      nodes.sort((a, b) => a.y - b.y);
    }
    
    // Get the first and last nodes (they stay in place)
    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];
    
    if (direction === 'HORIZONTAL') {
      // Calculate total available space
      const startPos = firstNode.x + firstNode.width;
      const endPos = lastNode.x;
      const availableSpace = endPos - startPos;
      
      // Calculate positions for nodes between first and last
      const middleNodes = nodes.slice(1, nodes.length - 1);
      
      if (spacing !== undefined) {
        // Fixed spacing distribution
        let currentX = firstNode.x + firstNode.width + spacing;
        
        for (const node of middleNodes) {
          node.x = currentX;
          currentX += node.width + spacing;
        }
      } else {
        // Even distribution across available space
        const totalMiddleNodesWidth = middleNodes.reduce((sum, node) => sum + node.width, 0);
        const gaps = middleNodes.length + 1; // Gaps between all nodes including first and last
        const spacePerGap = (availableSpace - totalMiddleNodesWidth) / gaps;
        
        let currentX = firstNode.x + firstNode.width + spacePerGap;
        
        for (const node of middleNodes) {
          node.x = currentX;
          currentX += node.width + spacePerGap;
        }
      }
    } else { // VERTICAL
      // Calculate total available space
      const startPos = firstNode.y + firstNode.height;
      const endPos = lastNode.y;
      const availableSpace = endPos - startPos;
      
      // Calculate positions for nodes between first and last
      const middleNodes = nodes.slice(1, nodes.length - 1);
      
      if (spacing !== undefined) {
        // Fixed spacing distribution
        let currentY = firstNode.y + firstNode.height + spacing;
        
        for (const node of middleNodes) {
          node.y = currentY;
          currentY += node.height + spacing;
        }
      } else {
        // Even distribution across available space
        const totalMiddleNodesHeight = middleNodes.reduce((sum, node) => sum + node.height, 0);
        const gaps = middleNodes.length + 1; // Gaps between all nodes including first and last
        const spacePerGap = (availableSpace - totalMiddleNodesHeight) / gaps;
        
        let currentY = firstNode.y + firstNode.height + spacePerGap;
        
        for (const node of middleNodes) {
          node.y = currentY;
          currentY += node.height + spacePerGap;
        }
      }
    }
    
    // Return information about the distributed nodes
    return {
      success: true,
      direction,
      nodeCount: nodes.length,
      fixedSpacing: spacing !== undefined,
      spacing: spacing !== undefined ? spacing : 'auto',
      nodes: nodes.map(node => ({
        id: node.id,
        name: node.name,
        x: node.x,
        y: node.y
      }))
    };
  } catch (error) {
    throw new Error(`Failed to distribute elements: ${error.message}`);
  }
}

// Create an advanced grid layout
function createGridLayout(params) {
  const {
    columns,
    rows,
    itemCount,
    columnGap = 16,
    rowGap = 16,
    cellWidth,
    cellHeight,
    parentId,
    x = 0,
    y = 0,
    name = 'Grid Layout',
    fillItems = true,
    useAutoLayout = true,
    responsive = false,
    templateAreas
  } = params;
  
  try {
    // Calculate number of rows if not provided
    const calculatedRows = rows || (itemCount ? Math.ceil(itemCount / columns) : 2);
    const actualRows = rows || calculatedRows;
    
    // Calculate the total size of the grid
    const totalWidth = columns * cellWidth + (columns - 1) * columnGap;
    const totalHeight = actualRows * cellHeight + (actualRows - 1) * rowGap;
    
    // Create the main frame for the grid
    const gridFrame = figma.createFrame();
    gridFrame.name = name;
    gridFrame.x = x;
    gridFrame.y = y;
    gridFrame.resize(totalWidth, totalHeight);
    
    // Store created cell nodes
    const cells = [];
    
    // Track named areas if templateAreas is provided
    const namedAreas = {};
    
    if (templateAreas) {
      // Parse template areas (similar to CSS grid-template-areas)
      // Each string in the array represents a row, and each word represents a cell
      // For example: ["header header", "sidebar content", "footer footer"]
      
      for (let rowIndex = 0; rowIndex < templateAreas.length; rowIndex++) {
        const row = templateAreas[rowIndex];
        const areas = row.split(/\s+/).filter(area => area.length > 0);
        
        for (let colIndex = 0; colIndex < areas.length && colIndex < columns; colIndex++) {
          const area = areas[colIndex];
          
          if (area !== '.') { // '.' is used for empty cells in CSS grid-template-areas
            if (!namedAreas[area]) {
              namedAreas[area] = [];
            }
            
            namedAreas[area].push({ row: rowIndex, col: colIndex });
          }
        }
      }
    }
    
    if (useAutoLayout) {
      // Use auto layout for the grid
      gridFrame.layoutMode = 'VERTICAL';
      gridFrame.primaryAxisAlignItems = 'MIN';
      gridFrame.counterAxisAlignItems = 'MIN';
      gridFrame.itemSpacing = rowGap;
      gridFrame.paddingTop = 0;
      gridFrame.paddingRight = 0;
      gridFrame.paddingBottom = 0;
      gridFrame.paddingLeft = 0;
      
      if (responsive) {
        gridFrame.primaryAxisSizingMode = 'AUTO';
        gridFrame.counterAxisSizingMode = 'FIXED';
      }
      
      // Create rows with horizontal auto layout
      for (let rowIndex = 0; rowIndex < actualRows; rowIndex++) {
        const rowFrame = figma.createFrame();
        rowFrame.name = `Row ${rowIndex + 1}`;
        rowFrame.layoutMode = 'HORIZONTAL';
        rowFrame.primaryAxisAlignItems = 'MIN';
        rowFrame.counterAxisAlignItems = 'MIN';
        rowFrame.itemSpacing = columnGap;
        rowFrame.resize(totalWidth, cellHeight);
        rowFrame.paddingTop = 0;
        rowFrame.paddingRight = 0;
        rowFrame.paddingBottom = 0;
        rowFrame.paddingLeft = 0;
        
        if (responsive) {
          rowFrame.primaryAxisSizingMode = 'FIXED';
          rowFrame.counterAxisSizingMode = 'AUTO';
        }
        
        gridFrame.appendChild(rowFrame);
        
        // Create cells in each row
        for (let colIndex = 0; colIndex < columns; colIndex++) {
          const cellFrame = figma.createFrame();
          cellFrame.name = `Cell ${rowIndex + 1}-${colIndex + 1}`;
          cellFrame.resize(cellWidth, cellHeight);
          
          // Check if this cell is part of a named area
          let areaName = null;
          for (const [name, coords] of Object.entries(namedAreas)) {
            if (coords.some(coord => coord.row === rowIndex && coord.col === colIndex)) {
              areaName = name;
              break;
            }
          }
          
          if (areaName) {
            cellFrame.name = areaName;
          }
          
          if (fillItems) {
            // Create a placeholder rectangle in the cell
            const rect = figma.createRectangle();
            rect.name = 'Placeholder';
            rect.resize(cellWidth - 16, cellHeight - 16); // Smaller than the cell for padding
            rect.x = 8;
            rect.y = 8;
            rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            rect.cornerRadius = 4;
            
            cellFrame.appendChild(rect);
          }
          
          rowFrame.appendChild(cellFrame);
          cells.push(cellFrame);
        }
      }
    } else {
      // Create grid without auto layout (absolute positioning)
      for (let rowIndex = 0; rowIndex < actualRows; rowIndex++) {
        for (let colIndex = 0; colIndex < columns; colIndex++) {
          const cellFrame = figma.createFrame();
          cellFrame.name = `Cell ${rowIndex + 1}-${colIndex + 1}`;
          cellFrame.resize(cellWidth, cellHeight);
          cellFrame.x = colIndex * (cellWidth + columnGap);
          cellFrame.y = rowIndex * (cellHeight + rowGap);
          
          // Check if this cell is part of a named area
          let areaName = null;
          for (const [name, coords] of Object.entries(namedAreas)) {
            if (coords.some(coord => coord.row === rowIndex && coord.col === colIndex)) {
              areaName = name;
              break;
            }
          }
          
          if (areaName) {
            cellFrame.name = areaName;
          }
          
          if (fillItems) {
            // Create a placeholder rectangle in the cell
            const rect = figma.createRectangle();
            rect.name = 'Placeholder';
            rect.resize(cellWidth - 16, cellHeight - 16); // Smaller than the cell for padding
            rect.x = 8;
            rect.y = 8;
            rect.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
            rect.cornerRadius = 4;
            
            cellFrame.appendChild(rect);
          }
          
          gridFrame.appendChild(cellFrame);
          cells.push(cellFrame);
        }
      }
    }
    
    // Add to parent if specified
    if (parentId) {
      const parent = figma.getNodeById(parentId);
      if (parent && 'appendChild' in parent) {
        parent.appendChild(gridFrame);
      } else {
        throw new Error(`Invalid parent node: ${parentId}`);
      }
    } else {
      // Add to current page if no parent is specified
      figma.currentPage.appendChild(gridFrame);
    }
    
    // Return information about the created grid
    return {
      success: true,
      id: gridFrame.id,
      name: gridFrame.name,
      width: gridFrame.width,
      height: gridFrame.height,
      columns,
      rows: actualRows,
      cellCount: cells.length,
      useAutoLayout,
      responsive,
      cells: cells.map(cell => ({
        id: cell.id,
        name: cell.name,
        x: cell.x,
        y: cell.y,
        width: cell.width,
        height: cell.height
      })),
      namedAreas: Object.keys(namedAreas)
    };
  } catch (error) {
    throw new Error(`Failed to create grid layout: ${error.message}`);
  }
}

// Batch edit component properties
function batchEditComponentProperties(params) {
  const { updates, propertyPresets, propertyFilter, applyToSelection } = params;
  
  try {
    // Track successful and failed updates
    const results = {
      successful: [],
      failed: []
    };
    
    // Process updates from the explicit updates array
    if (updates && updates.length > 0) {
      for (const update of updates) {
        try {
          const { instanceId, properties } = update;
          
          // Get the component instance
          const instance = figma.getNodeById(instanceId);
          
          if (!instance) {
            throw new Error(`Instance with ID ${instanceId} not found`);
          }
          
          if (instance.type !== 'INSTANCE') {
            throw new Error(`Node ${instanceId} is not a component instance`);
          }
          
          // Apply property updates
          applyProperties(instance, properties, propertyFilter);
          
          // Track successful update
          results.successful.push({
            id: instance.id,
            name: instance.name,
            updatedProperties: Object.keys(properties)
          });
        } catch (error) {
          // Track failed update
          results.failed.push({
            instanceId: update.instanceId,
            error: error.message
          });
        }
      }
    }
    
    // Process selection if requested
    if (applyToSelection) {
      const selectedInstances = figma.currentPage.selection.filter(node => node.type === 'INSTANCE');
      
      for (const instance of selectedInstances) {
        try {
          if (propertyPresets) {
            // Apply presets to this instance
            applyProperties(instance, propertyPresets, propertyFilter);
            
            // Track successful update
            results.successful.push({
              id: instance.id,
              name: instance.name,
              updatedProperties: Object.keys(propertyPresets)
            });
          } else {
            // Skip if no presets and this instance was already updated in the updates array
            if (updates && updates.some(update => update.instanceId === instance.id)) {
              continue;
            }
            
            throw new Error('No property presets defined for selection');
          }
        } catch (error) {
          // Track failed update
          results.failed.push({
            instanceId: instance.id,
            error: error.message
          });
        }
      }
    }
    
    return {
      success: results.successful.length > 0,
      updatedCount: results.successful.length,
      failedCount: results.failed.length,
      successful: results.successful,
      failed: results.failed
    };
  } catch (error) {
    throw new Error(`Failed to batch edit component properties: ${error.message}`);
  }
}

// Helper function to apply properties to a component instance
function applyProperties(instance, properties, propertyFilter) {
  // Get the instance's existing component properties
  const componentProperties = instance.componentProperties;
  
  // Filter properties based on propertyFilter if provided
  let filteredProperties = { ...properties };
  
  if (propertyFilter) {
    if (propertyFilter.names && propertyFilter.names.length > 0) {
      // Filter by property names
      filteredProperties = Object.fromEntries(
        Object.entries(filteredProperties).filter(([key]) => 
          propertyFilter.names.includes(key)
        )
      );
    }
    
    if (propertyFilter.types && propertyFilter.types.length > 0) {
      // Filter by property types
      filteredProperties = Object.fromEntries(
        Object.entries(filteredProperties).filter(([key]) => {
          const property = componentProperties[key];
          return property && propertyFilter.types.includes(property.type);
        })
      );
    }
  }
  
  // Check if there are any properties left after filtering
  if (Object.keys(filteredProperties).length === 0) {
    throw new Error('No properties left after applying filters');
  }
  
  // Create final property updates object
  const updates = {};
  
  // Validate each property before applying
  for (const [key, value] of Object.entries(filteredProperties)) {
    const propertyDef = componentProperties[key];
    
    if (!propertyDef) {
      throw new Error(`Property ${key} does not exist on this component instance`);
    }
    
    // Type check/coercion based on property type
    switch (propertyDef.type) {
      case 'TEXT':
        // Ensure value is a string
        updates[key] = String(value);
        break;
        
      case 'BOOLEAN':
        // Ensure value is a boolean
        updates[key] = Boolean(value);
        break;
        
      case 'INSTANCE_SWAP':
        // Value should be a component key
        if (typeof value !== 'string') {
          throw new Error(`Invalid value for INSTANCE_SWAP property ${key}: ${value}`);
        }
        updates[key] = value;
        break;
        
      case 'VARIANT':
        // Value should be a string (variant name)
        if (typeof value !== 'string') {
          throw new Error(`Invalid value for VARIANT property ${key}: ${value}`);
        }
        updates[key] = value;
        break;
        
      default:
        throw new Error(`Unknown property type: ${propertyDef.type}`);
    }
  }
  
  // Apply the validated updates
  instance.setProperties(updates);
  
  return Object.keys(updates);
}

// Design Token Converter
function convertDesignTokens(params) {
  const { 
    source, 
    target, 
    collectionId, 
    tokens,
    prefix = '',
    nameFormat = 'kebab-case',
    includeComments = true,
    groupByCategory = true
  } = params;
  
  try {
    // For converting from Figma variables to other formats
    if (source === 'figma') {
      // Get the variables from the specified collection
      let variables;
      
      if (collectionId) {
        const collection = figma.variables.getVariableCollectionById(collectionId);
        if (!collection) {
          throw new Error(`Variable collection not found: ${collectionId}`);
        }
        
        // Get variables from this collection
        variables = collection.variableIds.map(id => {
          const variable = figma.variables.getVariableById(id);
          return {
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType,
            valuesByMode: variable.valuesByMode
          };
        });
      } else {
        // Get all variables from all collections
        const collections = figma.variables.getLocalVariableCollections();
        variables = [];
        
        for (const collection of collections) {
          const collectionVariables = collection.variableIds.map(id => {
            const variable = figma.variables.getVariableById(id);
            return {
              id: variable.id,
              name: variable.name,
              type: variable.resolvedType,
              valuesByMode: variable.valuesByMode,
              collection: collection.name
            };
          });
          
          variables.push(...collectionVariables);
        }
      }
      
      // Convert variables to the target format
      switch (target) {
        case 'css':
          return convertToCss(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        case 'scss':
          return convertToScss(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        case 'js':
          return convertToJs(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        case 'json':
          return convertToJson(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        case 'tailwind':
          return convertToTailwind(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        case 'android':
          return convertToAndroid(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        case 'ios':
          return convertToIos(variables, { prefix, nameFormat, includeComments, groupByCategory });
          
        default:
          throw new Error(`Unsupported target format: ${target}`);
      }
    }
    // For converting from other formats to Figma variables
    else {
      // Parse the tokens
      let parsedTokens;
      
      if (!tokens) {
        throw new Error('Tokens parameter is required when source is not "figma"');
      }
      
      try {
        parsedTokens = JSON.parse(tokens);
      } catch (error) {
        throw new Error(`Invalid JSON format in tokens parameter: ${error.message}`);
      }
      
      // Process tokens based on the source format
      let processedTokens;
      
      switch (source) {
        case 'json':
          processedTokens = processJsonTokens(parsedTokens);
          break;
          
        case 'css':
          processedTokens = processCssTokens(parsedTokens);
          break;
          
        case 'scss':
          processedTokens = processScssTokens(parsedTokens);
          break;
          
        case 'js':
          processedTokens = processJsTokens(parsedTokens);
          break;
          
        case 'tailwind':
          processedTokens = processTailwindTokens(parsedTokens);
          break;
          
        case 'android':
          processedTokens = processAndroidTokens(parsedTokens);
          break;
          
        case 'ios':
          processedTokens = processIosTokens(parsedTokens);
          break;
          
        default:
          throw new Error(`Unsupported source format: ${source}`);
      }
      
      // Convert to Figma variables
      if (target === 'figma') {
        return importTokensToFigma(processedTokens, { prefix, nameFormat });
      } else {
        // Converting between non-Figma formats
        switch (target) {
          case 'css':
            return convertToCss(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          case 'scss':
            return convertToScss(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          case 'js':
            return convertToJs(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          case 'json':
            return convertToJson(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          case 'tailwind':
            return convertToTailwind(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          case 'android':
            return convertToAndroid(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          case 'ios':
            return convertToIos(processedTokens, { prefix, nameFormat, includeComments, groupByCategory });
            
          default:
            throw new Error(`Unsupported target format: ${target}`);
        }
      }
    }
  } catch (error) {
    throw new Error(`Failed to convert design tokens: ${error.message}`);
  }
}

// Helper function to format variable names according to the specified format
function formatVariableName(name, format, prefix = '') {
  // Clean the name: remove special characters and spaces
  let cleanName = name.replace(/[^\w\s-\/]/g, '').trim();
  
  // Split by slashes, spaces, and hyphens
  const parts = cleanName.split(/[\/\s-_]+/);
  
  // Format based on specified convention
  let formattedName;
  
  switch (format) {
    case 'camelCase':
      formattedName = parts[0].toLowerCase() + 
                     parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
      break;
      
    case 'PascalCase':
      formattedName = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
      break;
      
    case 'snake_case':
      formattedName = parts.map(p => p.toLowerCase()).join('_');
      break;
      
    case 'kebab-case':
    default:
      formattedName = parts.map(p => p.toLowerCase()).join('-');
      break;
  }
  
  // Add prefix if provided
  return prefix ? `${prefix}${formattedName}` : formattedName;
}

// Helper function to get CSS-compatible color value
function getCssColorValue(colorObj) {
  // Check if it's a RGB color object
  if (colorObj && 'r' in colorObj && 'g' in colorObj && 'b' in colorObj) {
    const r = Math.round(colorObj.r * 255);
    const g = Math.round(colorObj.g * 255);
    const b = Math.round(colorObj.b * 255);
    
    if ('a' in colorObj && colorObj.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${colorObj.a.toFixed(2)})`;
    } else {
      // Convert to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
  }
  
  // Return the value as-is if it's not a color object
  return colorObj;
}

// Helper function to convert variables to CSS custom properties
function convertToCss(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let cssOutput = ':root {\n';
  
  // Group variables by category if requested
  if (groupByCategory) {
    // Group by extracting category from variable name (before first slash or separator)
    const grouped = {};
    
    for (const variable of variables) {
      // Extract category from name
      const category = variable.name.split(/[\/\s-_]/)[0];
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(variable);
    }
    
    // Process each group
    for (const [category, vars] of Object.entries(grouped)) {
      if (includeComments) {
        cssOutput += `\n  /* ${category.toUpperCase()} */\n`;
      }
      
      for (const variable of vars) {
        const varName = formatVariableName(variable.name, nameFormat, prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        let value = variable.valuesByMode[modeId];
        
        // Format value based on variable type
        if (variable.type === 'COLOR') {
          value = getCssColorValue(value);
        } else if (variable.type === 'FLOAT' && typeof value === 'number') {
          // Add 'px' for spacing variables if they don't have units
          if (variable.name.includes('spacing') || variable.name.includes('size') || 
              variable.name.includes('width') || variable.name.includes('height') || 
              variable.name.includes('margin') || variable.name.includes('padding')) {
            value = `${value}px`;
          }
        }
        
        cssOutput += `  --${varName}: ${value};\n`;
      }
    }
  } else {
    // No grouping, process all variables sequentially
    for (const variable of variables) {
      const varName = formatVariableName(variable.name, nameFormat, prefix);
      
      // Include a comment with the original variable name if requested
      if (includeComments) {
        cssOutput += `  /* ${variable.name} (${variable.type}) */\n`;
      }
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      let value = variable.valuesByMode[modeId];
      
      // Format value based on variable type
      if (variable.type === 'COLOR') {
        value = getCssColorValue(value);
      } else if (variable.type === 'FLOAT' && typeof value === 'number') {
        // Add 'px' for spacing variables if they don't have units
        if (variable.name.includes('spacing') || variable.name.includes('size') || 
            variable.name.includes('width') || variable.name.includes('height') || 
            variable.name.includes('margin') || variable.name.includes('padding')) {
          value = `${value}px`;
        }
      }
      
      cssOutput += `  --${varName}: ${value};\n`;
    }
  }
  
  cssOutput += '}\n';
  
  return {
    format: 'css',
    code: cssOutput,
    variableCount: variables.length
  };
}

// Helper function to convert variables to SCSS variables
function convertToScss(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let scssOutput = '';
  
  // Group variables by category if requested
  if (groupByCategory) {
    // Group by extracting category from variable name (before first slash or separator)
    const grouped = {};
    
    for (const variable of variables) {
      // Extract category from name
      const category = variable.name.split(/[\/\s-_]/)[0];
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(variable);
    }
    
    // Process each group
    for (const [category, vars] of Object.entries(grouped)) {
      if (includeComments) {
        scssOutput += `\n// ${category.toUpperCase()}\n`;
      }
      
      for (const variable of vars) {
        const varName = formatVariableName(variable.name, nameFormat, prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        let value = variable.valuesByMode[modeId];
        
        // Format value based on variable type
        if (variable.type === 'COLOR') {
          value = getCssColorValue(value);
        } else if (variable.type === 'FLOAT' && typeof value === 'number') {
          // Add 'px' for spacing variables if they don't have units
          if (variable.name.includes('spacing') || variable.name.includes('size') || 
              variable.name.includes('width') || variable.name.includes('height') || 
              variable.name.includes('margin') || variable.name.includes('padding')) {
            value = `${value}px`;
          }
        }
        
        scssOutput += `${varName}: ${value};\n`;
      }
    }
  } else {
    // No grouping, process all variables sequentially
    for (const variable of variables) {
      const varName = formatVariableName(variable.name, nameFormat, prefix);
      
      // Include a comment with the original variable name if requested
      if (includeComments) {
        scssOutput += `// ${variable.name} (${variable.type})\n`;
      }
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      let value = variable.valuesByMode[modeId];
      
      // Format value based on variable type
      if (variable.type === 'COLOR') {
        value = getCssColorValue(value);
      } else if (variable.type === 'FLOAT' && typeof value === 'number') {
        // Add 'px' for spacing variables if they don't have units
        if (variable.name.includes('spacing') || variable.name.includes('size') || 
            variable.name.includes('width') || variable.name.includes('height') || 
            variable.name.includes('margin') || variable.name.includes('padding')) {
          value = `${value}px`;
        }
      }
      
      scssOutput += `${varName}: ${value};\n`;
    }
  }
  
  return {
    format: 'scss',
    code: scssOutput,
    variableCount: variables.length
  };
}

// Helper function to convert variables to JavaScript constants
function convertToJs(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let jsOutput = '';
  
  // Group variables by category if requested
  if (groupByCategory) {
    // Group by extracting category from variable name (before first slash or separator)
    const grouped = {};
    
    for (const variable of variables) {
      // Extract category from name
      const category = variable.name.split(/[\/\s-_]/)[0];
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(variable);
    }
    
    // Process each group
    for (const [category, vars] of Object.entries(grouped)) {
      if (includeComments) {
        jsOutput += `\n// ${category.toUpperCase()}\n`;
      }
      
      jsOutput += `export const ${category.toUpperCase()} = {\n`;
      
      for (const variable of vars) {
        let propName = formatVariableName(variable.name.replace(category, '').replace(/^[\/\s-_]+/, ''), nameFormat);
        if (!propName) {
          propName = 'default'; // Use 'default' if there's no name after removing the category
        }
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        let value = variable.valuesByMode[modeId];
        
        // Format value based on variable type
        if (variable.type === 'COLOR') {
          value = `"${getCssColorValue(value)}"`;
        } else if (variable.type === 'STRING') {
          value = `"${value}"`;
        } else if (variable.type === 'FLOAT' && typeof value === 'number') {
          value = value;
        }
        
        jsOutput += `  ${propName}: ${value},\n`;
      }
      
      jsOutput += `};\n`;
    }
  } else {
    // No grouping, export all variables as constants
    for (const variable of variables) {
      const constName = formatVariableName(variable.name, 'PascalCase', prefix); // Constants are typically PascalCase
      
      // Include a comment with the original variable name if requested
      if (includeComments) {
        jsOutput += `// ${variable.name} (${variable.type})\n`;
      }
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      let value = variable.valuesByMode[modeId];
      
      // Format value based on variable type
      if (variable.type === 'COLOR') {
        value = `"${getCssColorValue(value)}"`;
      } else if (variable.type === 'STRING') {
        value = `"${value}"`;
      }
      
      jsOutput += `export const ${constName} = ${value};\n`;
    }
  }
  
  return {
    format: 'js',
    code: jsOutput,
    variableCount: variables.length
  };
}

// Helper function to convert variables to JSON format
function convertToJson(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  // Create the output structure
  const output = {};
  
  // Group variables by category if requested
  if (groupByCategory) {
    // Group by extracting category from variable name (before first slash or separator)
    for (const variable of variables) {
      // Extract category from name
      const category = variable.name.split(/[\/\s-_]/)[0];
      
      if (!output[category]) {
        output[category] = {};
      }
      
      // Create a clean property name without the category prefix
      let propName = formatVariableName(variable.name.replace(category, '').replace(/^[\/\s-_]+/, ''), nameFormat);
      if (!propName) {
        propName = 'default'; // Use 'default' if there's no name after removing the category
      }
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      let value = variable.valuesByMode[modeId];
      
      // Format value based on variable type
      if (variable.type === 'COLOR') {
        value = getCssColorValue(value);
      }
      
      // Add value to the output
      output[category][propName] = value;
    }
  } else {
    // No grouping, flat structure
    for (const variable of variables) {
      const propName = formatVariableName(variable.name, nameFormat, prefix);
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      let value = variable.valuesByMode[modeId];
      
      // Format value based on variable type
      if (variable.type === 'COLOR') {
        value = getCssColorValue(value);
      }
      
      // Add metadata if comments are requested
      if (includeComments) {
        output[propName] = {
          value: value,
          type: variable.type,
          original_name: variable.name
        };
      } else {
        output[propName] = value;
      }
    }
  }
  
  return {
    format: 'json',
    code: JSON.stringify(output, null, 2),
    variableCount: variables.length
  };
}

// Helper function to convert variables to Tailwind configuration
function convertToTailwind(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let tailwindOutput = 'module.exports = {\n';
  tailwindOutput += '  theme: {\n';
  tailwindOutput += '    extend: {\n';
  
  // Maps for different Tailwind property groups
  const colorVars = [];
  const spacingVars = [];
  const fontSizeVars = [];
  const borderRadiusVars = [];
  const otherVars = [];
  
  // Categorize variables
  for (const variable of variables) {
    const varName = formatVariableName(variable.name, nameFormat);
    const modeId = Object.keys(variable.valuesByMode)[0];
    let value = variable.valuesByMode[modeId];
    
    // Format and categorize by variable type and name
    if (variable.type === 'COLOR') {
      value = getCssColorValue(value);
      colorVars.push({ name: varName, value, original: variable.name });
    } else if (variable.type === 'FLOAT' && typeof value === 'number') {
      if (variable.name.includes('spacing') || variable.name.includes('margin') || variable.name.includes('padding') || variable.name.includes('gap')) {
        spacingVars.push({ name: varName, value: `${value}px`, original: variable.name });
      } else if (variable.name.includes('fontSize') || variable.name.includes('text-size')) {
        fontSizeVars.push({ name: varName, value: `${value}px`, original: variable.name });
      } else if (variable.name.includes('radius') || variable.name.includes('corner')) {
        borderRadiusVars.push({ name: varName, value: `${value}px`, original: variable.name });
      } else {
        otherVars.push({ name: varName, value: `${value}px`, original: variable.name });
      }
    } else {
      otherVars.push({ name: varName, value, original: variable.name });
    }
  }
  
  // Add colors
  if (colorVars.length > 0) {
    tailwindOutput += '      colors: {\n';
    
    for (const colorVar of colorVars) {
      if (includeComments) {
        tailwindOutput += `        // ${colorVar.original}\n`;
      }
      tailwindOutput += `        '${colorVar.name}': '${colorVar.value}',\n`;
    }
    
    tailwindOutput += '      },\n';
  }
  
  // Add spacing
  if (spacingVars.length > 0) {
    tailwindOutput += '      spacing: {\n';
    
    for (const spacingVar of spacingVars) {
      if (includeComments) {
        tailwindOutput += `        // ${spacingVar.original}\n`;
      }
      tailwindOutput += `        '${spacingVar.name}': '${spacingVar.value}',\n`;
    }
    
    tailwindOutput += '      },\n';
  }
  
  // Add fontSize
  if (fontSizeVars.length > 0) {
    tailwindOutput += '      fontSize: {\n';
    
    for (const fontSizeVar of fontSizeVars) {
      if (includeComments) {
        tailwindOutput += `        // ${fontSizeVar.original}\n`;
      }
      tailwindOutput += `        '${fontSizeVar.name}': '${fontSizeVar.value}',\n`;
    }
    
    tailwindOutput += '      },\n';
  }
  
  // Add borderRadius
  if (borderRadiusVars.length > 0) {
    tailwindOutput += '      borderRadius: {\n';
    
    for (const borderRadiusVar of borderRadiusVars) {
      if (includeComments) {
        tailwindOutput += `        // ${borderRadiusVar.original}\n`;
      }
      tailwindOutput += `        '${borderRadiusVar.name}': '${borderRadiusVar.value}',\n`;
    }
    
    tailwindOutput += '      },\n';
  }
  
  // Close the configuration
  tailwindOutput += '    },\n';
  tailwindOutput += '  },\n';
  tailwindOutput += '};\n';
  
  return {
    format: 'tailwind',
    code: tailwindOutput,
    variableCount: variables.length
  };
}

// Helper function to convert variables to Android resource format (XML)
function convertToAndroid(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  // Create separate outputs for colors and dimensions
  let colorOutput = '<?xml version="1.0" encoding="utf-8"?>\n';
  colorOutput += '<resources>\n';
  
  let dimenOutput = '<?xml version="1.0" encoding="utf-8"?>\n';
  dimenOutput += '<resources>\n';
  
  // Android format prefers snake_case
  const actualNameFormat = 'snake_case';
  
  // Process variables
  const colorVars = [];
  const dimenVars = [];
  
  for (const variable of variables) {
    const varName = formatVariableName(variable.name, actualNameFormat, prefix);
    const modeId = Object.keys(variable.valuesByMode)[0];
    let value = variable.valuesByMode[modeId];
    
    if (variable.type === 'COLOR') {
      // Convert to Android color format (#AARRGGBB or #RRGGBB)
      let colorValue = getCssColorValue(value);
      
      // Convert from CSS rgba to Android alpha format if needed
      if (colorValue.startsWith('rgba')) {
        const matches = colorValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (matches) {
          const r = parseInt(matches[1]);
          const g = parseInt(matches[2]);
          const b = parseInt(matches[3]);
          const a = Math.round(parseFloat(matches[4]) * 255);
          colorValue = `#${a.toString(16).padStart(2, '0')}${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        }
      }
      
      colorVars.push({ name: varName, value: colorValue, original: variable.name });
    } else if (variable.type === 'FLOAT' && typeof value === 'number') {
      // Convert to Android dimension format (dp or sp)
      let dimenUnit = 'dp';
      // Use sp for font sizes
      if (variable.name.includes('font') || variable.name.includes('text-size') || variable.name.includes('typography')) {
        dimenUnit = 'sp';
      }
      
      dimenVars.push({ name: varName, value: `${value}${dimenUnit}`, original: variable.name });
    }
  }
  
  // Add color resources
  for (const colorVar of colorVars) {
    if (includeComments) {
      colorOutput += `    <!-- ${colorVar.original} -->\n`;
    }
    colorOutput += `    <color name="${colorVar.name}">${colorVar.value}</color>\n`;
  }
  
  // Add dimension resources
  for (const dimenVar of dimenVars) {
    if (includeComments) {
      dimenOutput += `    <!-- ${dimenVar.original} -->\n`;
    }
    dimenOutput += `    <dimen name="${dimenVar.name}">${dimenVar.value}</dimen>\n`;
  }
  
  colorOutput += '</resources>\n';
  dimenOutput += '</resources>\n';
  
  return {
    format: 'android',
    colorResource: colorOutput,
    dimenResource: dimenOutput,
    variableCount: colorVars.length + dimenVars.length
  };
}

// Helper function to convert variables to iOS format (Swift)
function convertToIos(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let swiftOutput = 'import UIKit\n\n';
  swiftOutput += 'struct DesignTokens {\n';
  
  // Group variables by category if requested
  if (groupByCategory) {
    // Group by extracting category from variable name (before first slash or separator)
    const grouped = {};
    
    for (const variable of variables) {
      // Extract category from name
      const category = variable.name.split(/[\/\s-_]/)[0];
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push(variable);
    }
    
    // Process each group
    for (const [category, vars] of Object.entries(grouped)) {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      
      if (includeComments) {
        swiftOutput += `    // ${category.toUpperCase()}\n`;
      }
      
      swiftOutput += `    struct ${categoryName} {\n`;
      
      for (const variable of vars) {
        const propName = formatVariableName(variable.name.replace(category, '').replace(/^[\/\s-_]+/, ''), 'camelCase');
        
        // Include a comment with the original variable name if requested
        if (includeComments) {
          swiftOutput += `        // ${variable.name} (${variable.type})\n`;
        }
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        let value = variable.valuesByMode[modeId];
        
        // Format value based on variable type
        if (variable.type === 'COLOR') {
          // Convert color to iOS Swift format
          const colorValue = getCssColorValue(value);
          
          if (colorValue.startsWith('#')) {
            // Parse hex color
            let hex = colorValue.substring(1);
            let alpha = 1.0;
            let r, g, b;
            
            if (hex.length === 8) {
              // #RRGGBBAA format
              r = parseInt(hex.substring(0, 2), 16) / 255;
              g = parseInt(hex.substring(2, 4), 16) / 255;
              b = parseInt(hex.substring(4, 6), 16) / 255;
              alpha = parseInt(hex.substring(6, 8), 16) / 255;
            } else {
              // #RRGGBB format
              r = parseInt(hex.substring(0, 2), 16) / 255;
              g = parseInt(hex.substring(2, 4), 16) / 255;
              b = parseInt(hex.substring(4, 6), 16) / 255;
            }
            
            swiftOutput += `        static let ${propName} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${alpha.toFixed(3)})\n`;
          } else if (colorValue.startsWith('rgba')) {
            // Parse rgba color
            const matches = colorValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (matches) {
              const r = parseInt(matches[1]) / 255;
              const g = parseInt(matches[2]) / 255;
              const b = parseInt(matches[3]) / 255;
              const a = parseFloat(matches[4]);
              
              swiftOutput += `        static let ${propName} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${a.toFixed(3)})\n`;
            }
          } else {
            // Use named colors or other formats
            swiftOutput += `        static let ${propName} = UIColor(named: "${propName}")!\n`;
          }
        } else if (variable.type === 'FLOAT') {
          swiftOutput += `        static let ${propName}: CGFloat = ${value}\n`;
        } else {
          swiftOutput += `        static let ${propName} = "${value}"\n`;
        }
      }
      
      swiftOutput += `    }\n\n`;
    }
  } else {
    // No grouping, flat structure
    for (const variable of variables) {
      const propName = formatVariableName(variable.name, 'camelCase', prefix);
      
      // Include a comment with the original variable name if requested
      if (includeComments) {
        swiftOutput += `    // ${variable.name} (${variable.type})\n`;
      }
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      let value = variable.valuesByMode[modeId];
      
      // Format value based on variable type
      if (variable.type === 'COLOR') {
        // Convert color to iOS Swift format
        const colorValue = getCssColorValue(value);
        
        if (colorValue.startsWith('#')) {
          // Parse hex color
          let hex = colorValue.substring(1);
          let alpha = 1.0;
          let r, g, b;
          
          if (hex.length === 8) {
            // #RRGGBBAA format
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
            alpha = parseInt(hex.substring(6, 8), 16) / 255;
          } else {
            // #RRGGBB format
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
          }
          
          swiftOutput += `    static let ${propName} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${alpha.toFixed(3)})\n`;
        } else if (colorValue.startsWith('rgba')) {
          // Parse rgba color
          const matches = colorValue.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (matches) {
            const r = parseInt(matches[1]) / 255;
            const g = parseInt(matches[2]) / 255;
            const b = parseInt(matches[3]) / 255;
            const a = parseFloat(matches[4]);
            
            swiftOutput += `    static let ${propName} = UIColor(red: ${r.toFixed(3)}, green: ${g.toFixed(3)}, blue: ${b.toFixed(3)}, alpha: ${a.toFixed(3)})\n`;
          }
        } else {
          // Use named colors or other formats
          swiftOutput += `    static let ${propName} = UIColor(named: "${propName}")!\n`;
        }
      } else if (variable.type === 'FLOAT') {
        swiftOutput += `    static let ${propName}: CGFloat = ${value}\n`;
      } else {
        swiftOutput += `    static let ${propName} = "${value}"\n`;
      }
    }
  }
  
  swiftOutput += '}\n';
  
  return {
    format: 'ios',
    code: swiftOutput,
    variableCount: variables.length
  };
}

// Helper functions for importing from other formats

// Process JSON design tokens
function processJsonTokens(tokens) {
  const variables = [];
  
  // Recursively process the token structure
  function extractVariables(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      // Check if the value is an object (nested structure)
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Check if it's a value with metadata
        if (value.value !== undefined) {
          const variable = {
            name: prefix ? `${prefix}/${key}` : key,
            type: inferType(value.value),
            valuesByMode: { 'default': value.value }
          };
          
          variables.push(variable);
        } else {
          // Nested object, recurse
          extractVariables(value, prefix ? `${prefix}/${key}` : key);
        }
      } else {
        // Leaf value
        const variable = {
          name: prefix ? `${prefix}/${key}` : key,
          type: inferType(value),
          valuesByMode: { 'default': value }
        };
        
        variables.push(variable);
      }
    }
  }
  
  extractVariables(tokens);
  return variables;
}

// Process CSS variables
function processCssTokens(tokensStr) {
  const variables = [];
  
  // Extract CSS variables
  const regex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  
  while ((match = regex.exec(tokensStr)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    
    const variable = {
      name,
      type: inferType(value),
      valuesByMode: { 'default': convertCssValue(value) }
    };
    
    variables.push(variable);
  }
  
  return variables;
}

// Process SCSS variables
function processScssTokens(tokensStr) {
  const variables = [];
  
  // Extract SCSS variables
  const regex = /\$([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  
  while ((match = regex.exec(tokensStr)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    
    const variable = {
      name,
      type: inferType(value),
      valuesByMode: { 'default': convertCssValue(value) }
    };
    
    variables.push(variable);
  }
  
  return variables;
}

// Process JavaScript tokens
function processJsTokens(tokensObj) {
  const variables = [];
  
  // Extract variables from JS object
  function extractJsVariables(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Nested object
        extractJsVariables(value, prefix ? `${prefix}/${key}` : key);
      } else {
        // Leaf value
        const variable = {
          name: prefix ? `${prefix}/${key}` : key,
          type: inferType(value),
          valuesByMode: { 'default': value }
        };
        
        variables.push(variable);
      }
    }
  }
  
  extractJsVariables(tokensObj);
  return variables;
}

// Process Tailwind config
function processTailwindTokens(config) {
  const variables = [];
  
  // Extract theme values
  if (config && config.theme && config.theme.extend) {
    const { colors, spacing, fontSize, borderRadius, ...rest } = config.theme.extend;
    
    // Process colors
    if (colors) {
      for (const [key, value] of Object.entries(colors)) {
        if (typeof value === 'string') {
          variables.push({
            name: `color/${key}`,
            type: 'COLOR',
            valuesByMode: { 'default': convertCssValue(value) }
          });
        } else if (typeof value === 'object') {
          // Color with shades
          for (const [shade, shadeValue] of Object.entries(value)) {
            variables.push({
              name: `color/${key}/${shade}`,
              type: 'COLOR',
              valuesByMode: { 'default': convertCssValue(shadeValue) }
            });
          }
        }
      }
    }
    
    // Process spacing
    if (spacing) {
      for (const [key, value] of Object.entries(spacing)) {
        variables.push({
          name: `spacing/${key}`,
          type: 'FLOAT',
          valuesByMode: { 'default': convertCssValue(value) }
        });
      }
    }
    
    // Process fontSize
    if (fontSize) {
      for (const [key, value] of Object.entries(fontSize)) {
        variables.push({
          name: `fontSize/${key}`,
          type: 'FLOAT',
          valuesByMode: { 'default': convertCssValue(value) }
        });
      }
    }
    
    // Process borderRadius
    if (borderRadius) {
      for (const [key, value] of Object.entries(borderRadius)) {
        variables.push({
          name: `borderRadius/${key}`,
          type: 'FLOAT',
          valuesByMode: { 'default': convertCssValue(value) }
        });
      }
    }
    
    // Process other properties
    for (const [category, values] of Object.entries(rest)) {
      for (const [key, value] of Object.entries(values)) {
        variables.push({
          name: `${category}/${key}`,
          type: inferType(value),
          valuesByMode: { 'default': convertCssValue(value) }
        });
      }
    }
  }
  
  return variables;
}

// Process Android resource format
function processAndroidTokens(xml) {
  const variables = [];
  
  // Extract color resources
  const colorRegex = /<color name="([^"]+)">([^<]+)<\/color>/g;
  let colorMatch;
  
  while ((colorMatch = colorRegex.exec(xml)) !== null) {
    const name = colorMatch[1];
    const value = colorMatch[2].trim();
    
    variables.push({
      name: `color/${name}`,
      type: 'COLOR',
      valuesByMode: { 'default': convertAndroidColor(value) }
    });
  }
  
  // Extract dimension resources
  const dimenRegex = /<dimen name="([^"]+)">([^<]+)<\/dimen>/g;
  let dimenMatch;
  
  while ((dimenMatch = dimenRegex.exec(xml)) !== null) {
    const name = dimenMatch[1];
    const value = dimenMatch[2].trim();
    
    variables.push({
      name: `spacing/${name}`,
      type: 'FLOAT',
      valuesByMode: { 'default': convertAndroidDimen(value) }
    });
  }
  
  return variables;
}

// Process iOS Swift format
function processIosTokens(swift) {
  const variables = [];
  
  // Extract UIColor definitions
  const colorRegex = /static let (\w+) = UIColor\(red: ([\d.]+), green: ([\d.]+), blue: ([\d.]+), alpha: ([\d.]+)\)/g;
  let colorMatch;
  
  while ((colorMatch = colorRegex.exec(swift)) !== null) {
    const name = colorMatch[1];
    const r = parseFloat(colorMatch[2]);
    const g = parseFloat(colorMatch[3]);
    const b = parseFloat(colorMatch[4]);
    const a = parseFloat(colorMatch[5]);
    
    variables.push({
      name: `color/${name}`,
      type: 'COLOR',
      valuesByMode: { 
        'default': { 
          r: r, 
          g: g, 
          b: b, 
          a: a 
        } 
      }
    });
  }
  
  // Extract CGFloat constants
  const floatRegex = /static let (\w+): CGFloat = ([\d.]+)/g;
  let floatMatch;
  
  while ((floatMatch = floatRegex.exec(swift)) !== null) {
    const name = floatMatch[1];
    const value = parseFloat(floatMatch[2]);
    
    variables.push({
      name: `spacing/${name}`,
      type: 'FLOAT',
      valuesByMode: { 'default': value }
    });
  }
  
  // Extract string constants
  const stringRegex = /static let (\w+) = "([^"]*)"/g;
  let stringMatch;
  
  while ((stringMatch = stringRegex.exec(swift)) !== null) {
    const name = stringMatch[1];
    const value = stringMatch[2];
    
    // Skip if it's a color name
    if (!swift.includes(`UIColor(named: "${name}")`)) {
      variables.push({
        name: `string/${name}`,
        type: 'STRING',
        valuesByMode: { 'default': value }
      });
    }
  }
  
  return variables;
}

// Import tokens to Figma variables
async function importTokensToFigma(variables, options) {
  const { prefix, nameFormat } = options;
  
  try {
    // Create collections for different token types
    const collections = {};
    const collectionNames = ['Colors', 'Spacing', 'Typography', 'Other'];
    
    // Create collections if they don't exist
    for (const name of collectionNames) {
      const existingCollections = figma.variables.getLocalVariableCollections();
      const existing = existingCollections.find(c => c.name === name);
      
      if (existing) {
        collections[name] = existing;
      } else {
        const collection = figma.variables.createVariableCollection(name);
        collections[name] = collection;
      }
    }
    
    // Process variables and create Figma variables
    const results = [];
    
    for (const variable of variables) {
      try {
        // Format the variable name
        const varName = formatVariableName(variable.name, nameFormat, prefix);
        
        // Determine which collection to use based on the variable type or name
        let collectionKey = 'Other';
        
        if (variable.type === 'COLOR') {
          collectionKey = 'Colors';
        } else if (variable.name.includes('spacing') || variable.name.includes('size') || 
                   variable.name.includes('margin') || variable.name.includes('padding')) {
          collectionKey = 'Spacing';
        } else if (variable.name.includes('font') || variable.name.includes('text')) {
          collectionKey = 'Typography';
        }
        
        const collection = collections[collectionKey];
        
        // Determine the variable type
        let figmaType;
        switch (variable.type) {
          case 'COLOR':
            figmaType = 'COLOR';
            break;
          case 'FLOAT':
          case 'NUMBER':
            figmaType = 'FLOAT';
            break;
          case 'STRING':
            figmaType = 'STRING';
            break;
          case 'BOOLEAN':
            figmaType = 'BOOLEAN';
            break;
          default:
            figmaType = 'STRING'; // Default to string for unknown types
        }
        
        // Create the variable
        const figmaVar = figma.variables.createVariable(varName, collection, figmaType);
        
        // Set the initial value
        const value = variable.valuesByMode.default;
        figmaVar.setValueForMode(collection.defaultModeId, value);
        
        results.push({
          id: figmaVar.id,
          name: figmaVar.name,
          type: figmaVar.resolvedType,
          collection: collectionKey
        });
      } catch (error) {
        console.error(`Failed to create variable for ${variable.name}:`, error);
      }
    }
    
    return {
      success: true,
      variables: results,
      collectionIds: Object.fromEntries(
        Object.entries(collections).map(([name, collection]) => [name, collection.id])
      )
    };
  } catch (error) {
    throw new Error(`Failed to import tokens to Figma: ${error.message}`);
  }
}

// Helper utilities

// Infer variable type from value
function inferType(value) {
  if (value === null || value === undefined) {
    return 'STRING';
  }
  
  if (typeof value === 'string') {
    // Check if it's a color value
    if (value.startsWith('#') || value.startsWith('rgb') || 
        value.startsWith('hsl') || CSS_COLOR_NAMES.includes(value.toLowerCase())) {
      return 'COLOR';
    }
    
    // Check if it's a number with a unit
    if (/^[\d.]+(?:px|rem|em|%|vh|vw|vmin|vmax|pt|pc|in|cm|mm|ex|ch)$/.test(value)) {
      return 'FLOAT';
    }
    
    return 'STRING';
  }
  
  if (typeof value === 'number') {
    return 'FLOAT';
  }
  
  if (typeof value === 'boolean') {
    return 'BOOLEAN';
  }
  
  return 'STRING';
}

// Convert CSS color value to Figma color object
function convertCssValue(value) {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Handle colors
  if (value.startsWith('#')) {
    return hexToRgb(value);
  } else if (value.startsWith('rgb')) {
    return rgbStringToRgb(value);
  }
  
  // Handle dimensions
  const match = value.match(/^([\d.]+)(px|rem|em|%|vh|vw|vmin|vmax|pt|pc|in|cm|mm|ex|ch)$/);
  if (match) {
    // Convert to pixels (approximate)
    let num = parseFloat(match[1]);
    const unit = match[2];
    
    // This is a simplification, as accurate conversion would require context
    if (unit === 'rem' || unit === 'em') {
      // Assume 1rem = 16px
      num *= 16;
    }
    
    return num;
  }
  
  return value;
}

// Convert hex color to RGB object
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse hex values
  let r, g, b, a = 1;
  
  if (hex.length === 3) {
    // #RGB format
    r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
    g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
    b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;
  } else if (hex.length === 6) {
    // #RRGGBB format
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  } else if (hex.length === 8) {
    // #RRGGBBAA format
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
    a = parseInt(hex.substring(6, 8), 16) / 255;
  }
  
  return { r, g, b, a };
}

// Convert RGB string to RGB object
function rgbStringToRgb(rgbStr) {
  const rgbaMatch = rgbStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]) / 255;
    const g = parseInt(rgbaMatch[2]) / 255;
    const b = parseInt(rgbaMatch[3]) / 255;
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
    
    return { r, g, b, a };
  }
  
  return { r: 0, g: 0, b: 0, a: 1 }; // Default black color
}

// Convert Android color format to Figma color object
function convertAndroidColor(color) {
  // Remove # if present
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  
  // Handle named colors
  if (CSS_COLOR_NAMES.includes(color.toLowerCase())) {
    // Create a temporary element to get RGB values
    // For Figma, we would need a mapping or approximation
    return { r: 0, g: 0, b: 0, a: 1 }; // Default for now
  }
  
  return { r: 0, g: 0, b: 0, a: 1 }; // Default black color
}

// Convert Android dimension value to number
function convertAndroidDimen(dimen) {
  const match = dimen.match(/([\d.]+)(dp|sp|px)/);
  
  if (match) {
    return parseFloat(match[1]);
  }
  
  return 0; // Default value
}

// List of CSS color names for type inference
const CSS_COLOR_NAMES = [
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure', 'beige', 'bisque', 'black',
  'blanchedalmond', 'blue', 'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
  'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson', 'cyan', 'darkblue', 'darkcyan',
  'darkgoldenrod', 'darkgray', 'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen',
  'darkorange', 'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
  'darkslategray', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue', 'dimgray',
  'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen', 'fuchsia', 'gainsboro', 'ghostwhite',
  'gold', 'goldenrod', 'gray', 'green', 'greenyellow', 'honeydew', 'hotpink', 'indianred',
  'indigo', 'ivory', 'khaki', 'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon',
  'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen',
  'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray',
  'lightsteelblue', 'lightyellow', 'lime', 'limegreen', 'linen', 'magenta', 'maroon',
  'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple', 'mediumseagreen',
  'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred', 'midnightblue',
  'mintcream', 'mistyrose', 'moccasin', 'navajowhite', 'navy', 'oldlace', 'olive', 'olivedrab',
  'orange', 'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
  'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'rebeccapurple', 'red', 'rosybrown', 'royalblue', 'saddlebrown', 'salmon', 'sandybrown',
  'seagreen', 'seashell', 'sienna', 'silver', 'skyblue', 'slateblue', 'slategray', 'snow',
  'springgreen', 'steelblue', 'tan', 'teal', 'thistle', 'tomato', 'turquoise', 'violet', 'wheat',
  'white', 'whitesmoke', 'yellow', 'yellowgreen'
];

// Import component from library
async function importComponentFromLibrary(params) {
  const { componentKey } = params;
  
  try {
    const component = await figma.importComponentByKeyAsync(componentKey);
    
    return {
      id: component.id,
      name: component.name,
      type: component.type,
      key: component.key
    };
  } catch (error) {
    throw new Error(`Failed to import component: ${error.message}`);
  }
}

// Update instance properties
function updateInstanceProperties(params) {
  const { instanceId, properties } = params;
  
  try {
    const instance = figma.getNodeById(instanceId);
    if (!instance || instance.type !== 'INSTANCE') {
      throw new Error(`Component instance not found: ${instanceId}`);
    }
    
    instance.setProperties(properties);
    
    return {
      id: instance.id,
      name: instance.name,
      properties: instance.componentProperties
    };
  } catch (error) {
    throw new Error(`Failed to update instance properties: ${error.message}`);
  }
}

// Create button component
function createButtonComponent(params) {
  const { name = 'Button', size = 'medium' } = params;
  
  try {
    // Define sizes
    const sizes = {
      small: { width: 80, height: 32, fontSize: 14 },
      medium: { width: 120, height: 40, fontSize: 16 },
      large: { width: 160, height: 48, fontSize: 18 }
    };
    
    const sizeConfig = sizes[size];
    
    // Create the component
    const component = figma.createComponent();
    component.name = name;
    component.resize(sizeConfig.width, sizeConfig.height);
    
    // Add component properties
    const labelProp = component.addComponentProperty('Label', 'TEXT', 'Button');
    const stateProp = component.addComponentProperty('State', 'VARIANT', 'default');
    
    // Load font first
    return figma.loadFontAsync({ family: 'Inter', style: 'Regular' }).then(() => {
      // Create text node
      const text = figma.createText();
      text.characters = 'Button';
      text.fontSize = sizeConfig.fontSize;
      text.x = 10;
      text.y = (sizeConfig.height - sizeConfig.fontSize) / 2;
      
      // Apply text property reference
      text.componentPropertyReferences = { characters: labelProp };
      
      component.appendChild(text);
      
      // Add auto-layout
      component.layoutMode = 'HORIZONTAL';
      component.primaryAxisAlignItems = 'CENTER';
      component.counterAxisAlignItems = 'CENTER';
      component.paddingLeft = 16;
      component.paddingRight = 16;
      component.paddingTop = 8;
      component.paddingBottom = 8;
      
      // Add fills and corner radius
      component.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.4, b: 1 } }];
      component.cornerRadius = 4;
      
      return {
        id: component.id,
        name: component.name,
        type: component.type,
        size: size,
        properties: ['Label', 'State']
      };
    });
  } catch (error) {
    throw new Error(`Failed to create button component: ${error.message}`);
  }
}

// Create design system components
function createDesignSystemComponents() {
  const results = [];
  
  // Create button component
  return createButtonComponent({ name: 'Button', size: 'medium' }).then(button => {
    const buttonResult = { type: 'button' };
    Object.keys(button).forEach(key => {
      buttonResult[key] = button[key];
    });
    results.push(buttonResult);
    
    // Create input component
    const input = figma.createComponent();
    input.name = 'Input';
    input.resize(200, 40);
    input.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
    input.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
    input.strokeWeight = 1;
    input.cornerRadius = 4;
    
    const placeholder = input.addComponentProperty('Placeholder', 'TEXT', 'Enter text...');
    const value = input.addComponentProperty('Value', 'TEXT', '');
    
    results.push({
      type: 'input',
      id: input.id,
      name: input.name
    });
    
    // Create card component
    const card = figma.createComponent();
    card.name = 'Card';
    card.resize(300, 200);
    card.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    card.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 2 },
      radius: 4,
      visible: true
    }];
    card.cornerRadius = 8;
    
    results.push({
      type: 'card',
      id: card.id,
      name: card.name
    });
    
    return {
      message: 'Design system components created successfully',
      components: results
    };
  }).catch(error => {
    throw new Error(`Failed to create design system components: ${error.message}`);
  });
}

// Apply text property to a text node in a component
function applyTextProperty(params) {
  const { componentId, textNodeId, propertyName } = params;
  
  try {
    const component = figma.getNodeById(componentId);
    if (!component || component.type !== 'COMPONENT') {
      throw new Error(`Component not found: ${componentId}`);
    }
    
    const textNode = figma.getNodeById(textNodeId);
    if (!textNode || textNode.type !== 'TEXT') {
      throw new Error(`Text node not found: ${textNodeId}`);
    }
    
    // Create the property
    const property = component.addComponentProperty(propertyName, 'TEXT', textNode.characters);
    
    // Apply property reference to text node
    textNode.componentPropertyReferences = { characters: property };
    
    return {
      componentId: component.id,
      textNodeId: textNode.id,
      propertyName: property
    };
  } catch (error) {
    throw new Error(`Failed to apply text property: ${error.message}`);
  }
}

// Create instance swap property
function createInstanceSwapProperty(params) {
  const { componentId, propertyName, defaultComponentKey } = params;
  
  try {
    const component = figma.getNodeById(componentId);
    if (!component || component.type !== 'COMPONENT') {
      throw new Error(`Component not found: ${componentId}`);
    }
    
    const property = component.addComponentProperty(
      propertyName, 
      'INSTANCE_SWAP', 
      defaultComponentKey || null
    );
    
    return {
      componentId: component.id,
      propertyName: property,
      type: 'INSTANCE_SWAP'
    };
  } catch (error) {
    throw new Error(`Failed to create instance swap property: ${error.message}`);
  }
}

// Notify the UI that the plugin is ready
figma.ui.postMessage({
  type: 'plugin_ready'
});
