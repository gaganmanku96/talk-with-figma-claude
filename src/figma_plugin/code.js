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

// Get local components
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
