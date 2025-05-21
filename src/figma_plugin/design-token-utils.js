// Utility functions for the Design Token Converter feature

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
        const value = variable.valuesByMode[modeId];
        
        // Format value based on type
        let formattedValue;
        
        if (variable.type === 'COLOR') {
          formattedValue = getCssColorValue(value);
        } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
          formattedValue = `${value}px`;
        } else {
          formattedValue = value.toString();
        }
        
        cssOutput += `  --${varName}: ${formattedValue};\n`;
      }
    }
  } else {
    // Flat list of variables (no grouping)
    for (const variable of variables) {
      const varName = formatVariableName(variable.name, nameFormat, prefix);
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      const value = variable.valuesByMode[modeId];
      
      // Format value based on type
      let formattedValue;
      
      if (variable.type === 'COLOR') {
        formattedValue = getCssColorValue(value);
      } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
        formattedValue = `${value}px`;
      } else {
        formattedValue = value.toString();
      }
      
      cssOutput += `  --${varName}: ${formattedValue};\n`;
    }
  }
  
  cssOutput += '}\n';
  
  return {
    format: 'css',
    variables: variables.length,
    code: cssOutput
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
        const value = variable.valuesByMode[modeId];
        
        // Format value based on type
        let formattedValue;
        
        if (variable.type === 'COLOR') {
          formattedValue = getCssColorValue(value);
        } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
          formattedValue = `${value}px`;
        } else {
          formattedValue = value.toString();
        }
        
        scssOutput += `$${varName}: ${formattedValue};\n`;
      }
    }
  } else {
    // Flat list of variables (no grouping)
    for (const variable of variables) {
      const varName = formatVariableName(variable.name, nameFormat, prefix);
      
      // Get the value from the first mode
      const modeId = Object.keys(variable.valuesByMode)[0];
      const value = variable.valuesByMode[modeId];
      
      // Format value based on type
      let formattedValue;
      
      if (variable.type === 'COLOR') {
        formattedValue = getCssColorValue(value);
      } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
        formattedValue = `${value}px`;
      } else {
        formattedValue = value.toString();
      }
      
      scssOutput += `$${varName}: ${formattedValue};\n`;
    }
  }
  
  return {
    format: 'scss',
    variables: variables.length,
    code: scssOutput
  };
}

// Helper function to convert variables to JavaScript object
function convertToJs(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  // Prepare multimode output if variables have multiple modes
  const modes = new Set();
  variables.forEach(variable => {
    Object.keys(variable.valuesByMode).forEach(modeId => {
      modes.add(modeId);
    });
  });
  
  // Single mode output (simple object)
  if (modes.size <= 1) {
    let jsOutput = 'export const tokens = {\n';
    
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
          jsOutput += `\n  // ${category.toUpperCase()}\n`;
        }
        
        jsOutput += `  ${category}: {\n`;
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'camelCase');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          // Format value based on type
          let formattedValue;
          
          if (variable.type === 'COLOR') {
            formattedValue = `"${getCssColorValue(value)}"`;
          } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
            formattedValue = value;
          } else if (variable.type === 'BOOLEAN') {
            formattedValue = value;
          } else {
            formattedValue = `"${value.toString()}"`;
          }
          
          jsOutput += `    ${varName}: ${formattedValue},\n`;
        }
        
        jsOutput += '  },\n';
      }
    } else {
      // Flat list of variables (no grouping)
      for (const variable of variables) {
        const varName = formatVariableName(variable.name, 'camelCase', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        // Format value based on type
        let formattedValue;
        
        if (variable.type === 'COLOR') {
          formattedValue = `"${getCssColorValue(value)}"`;
        } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
          formattedValue = value;
        } else if (variable.type === 'BOOLEAN') {
          formattedValue = value;
        } else {
          formattedValue = `"${value.toString()}"`;
        }
        
        jsOutput += `  ${varName}: ${formattedValue},\n`;
      }
    }
    
    jsOutput += '};\n';
    
    return {
      format: 'js',
      variables: variables.length,
      code: jsOutput
    };
  } else {
    // Multi-mode output (themes)
    let jsOutput = 'export const themes = {\n';
    
    // Get all mode IDs and names
    const modeInfo = {};
    const modeOrder = [...modes];
    
    // Extract mode names if available
    if (variables.length > 0 && variables[0].collection) {
      const collections = figma.variables.getLocalVariableCollections();
      
      for (const collection of collections) {
        if (collection.name === variables[0].collection) {
          for (const mode of collection.modes) {
            modeInfo[mode.modeId] = mode.name;
          }
          break;
        }
      }
    }
    
    // Process each mode
    for (const modeId of modeOrder) {
      const modeName = modeInfo[modeId] || `theme-${modeId}`;
      const modeNameCamel = formatVariableName(modeName, 'camelCase');
      
      jsOutput += `  ${modeNameCamel}: {\n`;
      
      // Group variables by category if requested
      if (groupByCategory) {
        // Group by extracting category from variable name (before first slash or separator)
        const grouped = {};
        
        for (const variable of variables) {
          if (!(modeId in variable.valuesByMode)) {
            continue;
          }
          
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
            jsOutput += `\n    // ${category.toUpperCase()}\n`;
          }
          
          jsOutput += `    ${category}: {\n`;
          
          for (const variable of vars) {
            // Extract variable name without category prefix
            const parts = variable.name.split(/[\/\s-_]+/);
            const nameWithoutCategory = parts.slice(1).join('-');
            const varName = formatVariableName(nameWithoutCategory, 'camelCase');
            
            // Skip if this variable doesn't have a value for this mode
            if (!(modeId in variable.valuesByMode)) {
              continue;
            }
            
            const value = variable.valuesByMode[modeId];
            
            // Format value based on type
            let formattedValue;
            
            if (variable.type === 'COLOR') {
              formattedValue = `"${getCssColorValue(value)}"`;
            } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
              formattedValue = value;
            } else if (variable.type === 'BOOLEAN') {
              formattedValue = value;
            } else {
              formattedValue = `"${value.toString()}"`;
            }
            
            jsOutput += `      ${varName}: ${formattedValue},\n`;
          }
          
          jsOutput += '    },\n';
        }
      } else {
        // Flat list of variables (no grouping)
        for (const variable of variables) {
          // Skip if this variable doesn't have a value for this mode
          if (!(modeId in variable.valuesByMode)) {
            continue;
          }
          
          const varName = formatVariableName(variable.name, 'camelCase', prefix);
          const value = variable.valuesByMode[modeId];
          
          // Format value based on type
          let formattedValue;
          
          if (variable.type === 'COLOR') {
            formattedValue = `"${getCssColorValue(value)}"`;
          } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
            formattedValue = value;
          } else if (variable.type === 'BOOLEAN') {
            formattedValue = value;
          } else {
            formattedValue = `"${value.toString()}"`;
          }
          
          jsOutput += `    ${varName}: ${formattedValue},\n`;
        }
      }
      
      jsOutput += '  },\n';
    }
    
    jsOutput += '};\n';
    
    // Add the current theme
    jsOutput += '\n// Current theme (change as needed)\n';
    jsOutput += `export const tokens = themes.${formatVariableName(modeInfo[modeOrder[0]] || 'default', 'camelCase')};\n`;
    
    return {
      format: 'js',
      variables: variables.length,
      modes: modeOrder.length,
      code: jsOutput
    };
  }
}

// Helper function to convert variables to JSON format
function convertToJson(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  // Prepare JSON structure
  let jsonStructure;
  
  // Group variables by category if requested
  if (groupByCategory) {
    jsonStructure = {};
    
    for (const variable of variables) {
      // Extract category from name
      const category = variable.name.split(/[\/\s-_]/)[0];
      
      if (!jsonStructure[category]) {
        jsonStructure[category] = {};
      }
      
      // Extract variable name without category prefix
      const parts = variable.name.split(/[\/\s-_]+/);
      const nameWithoutCategory = parts.slice(1).join('-');
      const varName = formatVariableName(nameWithoutCategory, nameFormat);
      
      // Create nested structure for each mode
      const modeValues = {};
      
      for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
        // Format value based on type
        let formattedValue;
        
        if (variable.type === 'COLOR') {
          formattedValue = getCssColorValue(value);
        } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
          formattedValue = value;
        } else {
          formattedValue = value.toString();
        }
        
        modeValues[modeId] = formattedValue;
      }
      
      // If there's only one mode, simplify the structure
      if (Object.keys(modeValues).length === 1) {
        const modeId = Object.keys(modeValues)[0];
        jsonStructure[category][varName] = modeValues[modeId];
      } else {
        jsonStructure[category][varName] = {
          value: modeValues[Object.keys(modeValues)[0]],
          modes: modeValues
        };
      }
    }
  } else {
    // Flat list of variables (no grouping)
    jsonStructure = {};
    
    for (const variable of variables) {
      const varName = formatVariableName(variable.name, nameFormat, prefix);
      
      // Create nested structure for each mode
      const modeValues = {};
      
      for (const [modeId, value] of Object.entries(variable.valuesByMode)) {
        // Format value based on type
        let formattedValue;
        
        if (variable.type === 'COLOR') {
          formattedValue = getCssColorValue(value);
        } else if (variable.type === 'FLOAT' || variable.type === 'NUMBER') {
          formattedValue = value;
        } else {
          formattedValue = value.toString();
        }
        
        modeValues[modeId] = formattedValue;
      }
      
      // If there's only one mode, simplify the structure
      if (Object.keys(modeValues).length === 1) {
        const modeId = Object.keys(modeValues)[0];
        jsonStructure[varName] = modeValues[modeId];
      } else {
        jsonStructure[varName] = {
          value: modeValues[Object.keys(modeValues)[0]],
          modes: modeValues
        };
      }
    }
  }
  
  return {
    format: 'json',
    variables: variables.length,
    code: JSON.stringify(jsonStructure, null, 2)
  };
}

// Helper function to convert variables to Tailwind config
function convertToTailwind(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let jsOutput = 'module.exports = {\n';
  jsOutput += '  theme: {\n';
  jsOutput += '    extend: {\n';
  
  // Extract color and spacing variables
  const colorVariables = variables.filter(v => v.type === 'COLOR');
  const spacingVariables = variables.filter(v => ['FLOAT', 'NUMBER'].includes(v.type));
  
  // Add colors
  if (colorVariables.length > 0) {
    jsOutput += '      colors: {\n';
    
    // Group color variables by category if requested
    if (groupByCategory) {
      // Group by extracting category from variable name (before first slash or separator)
      const grouped = {};
      
      for (const variable of colorVariables) {
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
          jsOutput += `\n        // ${category.toUpperCase()}\n`;
        }
        
        jsOutput += `        ${category}: {\n`;
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'kebab-case');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          // Format the color value
          const colorValue = getCssColorValue(value);
          
          jsOutput += `          '${varName}': '${colorValue}',\n`;
        }
        
        jsOutput += '        },\n';
      }
    } else {
      // Flat list of color variables
      for (const variable of colorVariables) {
        const varName = formatVariableName(variable.name, 'kebab-case', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        // Format the color value
        const colorValue = getCssColorValue(value);
        
        jsOutput += `        '${varName}': '${colorValue}',\n`;
      }
    }
    
    jsOutput += '      },\n';
  }
  
  // Add spacing
  if (spacingVariables.length > 0) {
    jsOutput += '      spacing: {\n';
    
    // Group spacing variables by category if requested
    if (groupByCategory) {
      // Group by extracting category from variable name (before first slash or separator)
      const grouped = {};
      
      for (const variable of spacingVariables) {
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
          jsOutput += `\n        // ${category.toUpperCase()}\n`;
        }
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'kebab-case');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          jsOutput += `        '${category}-${varName}': '${value}px',\n`;
        }
      }
    } else {
      // Flat list of spacing variables
      for (const variable of spacingVariables) {
        const varName = formatVariableName(variable.name, 'kebab-case', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        jsOutput += `        '${varName}': '${value}px',\n`;
      }
    }
    
    jsOutput += '      },\n';
  }
  
  jsOutput += '    },\n';
  jsOutput += '  },\n';
  jsOutput += '  variants: {},\n';
  jsOutput += '  plugins: [],\n';
  jsOutput += '};\n';
  
  return {
    format: 'tailwind',
    variables: colorVariables.length + spacingVariables.length,
    code: jsOutput
  };
}

// Helper function to convert variables to Android resources
function convertToAndroid(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  // Create separate files for colors, dimens, etc.
  const colorVariables = variables.filter(v => v.type === 'COLOR');
  const dimenVariables = variables.filter(v => ['FLOAT', 'NUMBER'].includes(v.type));
  const stringVariables = variables.filter(v => v.type === 'STRING');
  const booleanVariables = variables.filter(v => v.type === 'BOOLEAN');
  
  let result = {};
  
  // Colors XML
  if (colorVariables.length > 0) {
    let colorsXml = '<?xml version="1.0" encoding="utf-8"?>\n';
    colorsXml += '<resources>\n';
    
    // Group by category if requested
    if (groupByCategory) {
      // Group by extracting category from variable name (before first slash or separator)
      const grouped = {};
      
      for (const variable of colorVariables) {
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
          colorsXml += `\n    <!-- ${category.toUpperCase()} -->\n`;
        }
        
        for (const variable of vars) {
          const varName = formatVariableName(variable.name, 'snake_case', prefix);
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          // Format the color value as Android hex (#AARRGGBB)
          const r = Math.round(value.r * 255).toString(16).padStart(2, '0');
          const g = Math.round(value.g * 255).toString(16).padStart(2, '0');
          const b = Math.round(value.b * 255).toString(16).padStart(2, '0');
          const a = value.a !== undefined ? Math.round(value.a * 255).toString(16).padStart(2, '0') : 'FF';
          
          colorsXml += `    <color name="${varName}">#${a}${r}${g}${b}</color>\n`;
        }
      }
    } else {
      // Flat list
      for (const variable of colorVariables) {
        const varName = formatVariableName(variable.name, 'snake_case', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        // Format the color value as Android hex (#AARRGGBB)
        const r = Math.round(value.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(value.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(value.b * 255).toString(16).padStart(2, '0');
        const a = value.a !== undefined ? Math.round(value.a * 255).toString(16).padStart(2, '0') : 'FF';
        
        colorsXml += `    <color name="${varName}">#${a}${r}${g}${b}</color>\n`;
      }
    }
    
    colorsXml += '</resources>';
    
    result.colors = {
      filename: 'colors.xml',
      content: colorsXml
    };
  }
  
  // Dimensions XML
  if (dimenVariables.length > 0) {
    let dimenXml = '<?xml version="1.0" encoding="utf-8"?>\n';
    dimenXml += '<resources>\n';
    
    // Group by category if requested
    if (groupByCategory) {
      // Group by extracting category from variable name (before first slash or separator)
      const grouped = {};
      
      for (const variable of dimenVariables) {
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
          dimenXml += `\n    <!-- ${category.toUpperCase()} -->\n`;
        }
        
        for (const variable of vars) {
          const varName = formatVariableName(variable.name, 'snake_case', prefix);
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          dimenXml += `    <dimen name="${varName}">${value}dp</dimen>\n`;
        }
      }
    } else {
      // Flat list
      for (const variable of dimenVariables) {
        const varName = formatVariableName(variable.name, 'snake_case', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        dimenXml += `    <dimen name="${varName}">${value}dp</dimen>\n`;
      }
    }
    
    dimenXml += '</resources>';
    
    result.dimens = {
      filename: 'dimens.xml',
      content: dimenXml
    };
  }
  
  // Strings XML
  if (stringVariables.length > 0) {
    let stringsXml = '<?xml version="1.0" encoding="utf-8"?>\n';
    stringsXml += '<resources>\n';
    
    // Group by category if requested
    if (groupByCategory) {
      // Group by extracting category from variable name (before first slash or separator)
      const grouped = {};
      
      for (const variable of stringVariables) {
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
          stringsXml += `\n    <!-- ${category.toUpperCase()} -->\n`;
        }
        
        for (const variable of vars) {
          const varName = formatVariableName(variable.name, 'snake_case', prefix);
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          // Escape XML special characters
          const escapedValue = value.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          
          stringsXml += `    <string name="${varName}">${escapedValue}</string>\n`;
        }
      }
    } else {
      // Flat list
      for (const variable of stringVariables) {
        const varName = formatVariableName(variable.name, 'snake_case', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        // Escape XML special characters
        const escapedValue = value.toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        
        stringsXml += `    <string name="${varName}">${escapedValue}</string>\n`;
      }
    }
    
    stringsXml += '</resources>';
    
    result.strings = {
      filename: 'strings.xml',
      content: stringsXml
    };
  }
  
  // Booleans XML
  if (booleanVariables.length > 0) {
    let booleansXml = '<?xml version="1.0" encoding="utf-8"?>\n';
    booleansXml += '<resources>\n';
    
    // Group by category if requested
    if (groupByCategory) {
      // Group by extracting category from variable name (before first slash or separator)
      const grouped = {};
      
      for (const variable of booleanVariables) {
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
          booleansXml += `\n    <!-- ${category.toUpperCase()} -->\n`;
        }
        
        for (const variable of vars) {
          const varName = formatVariableName(variable.name, 'snake_case', prefix);
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          booleansXml += `    <bool name="${varName}">${value.toString()}</bool>\n`;
        }
      }
    } else {
      // Flat list
      for (const variable of booleanVariables) {
        const varName = formatVariableName(variable.name, 'snake_case', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        booleansXml += `    <bool name="${varName}">${value.toString()}</bool>\n`;
      }
    }
    
    booleansXml += '</resources>';
    
    result.booleans = {
      filename: 'booleans.xml',
      content: booleansXml
    };
  }
  
  return {
    format: 'android',
    variables: variables.length,
    result
  };
}

// Helper function to convert variables to iOS Swift format
function convertToIos(variables, options) {
  const { prefix, nameFormat, includeComments, groupByCategory } = options;
  
  let swiftOutput = 'import UIKit\n\n';
  swiftOutput += 'struct DesignTokens {\n';
  
  // Group variables by category if requested
  if (groupByCategory) {
    // Group by type first
    const colorVariables = variables.filter(v => v.type === 'COLOR');
    const numberVariables = variables.filter(v => ['FLOAT', 'NUMBER'].includes(v.type));
    const stringVariables = variables.filter(v => v.type === 'STRING');
    const booleanVariables = variables.filter(v => v.type === 'BOOLEAN');
    
    // Process color variables
    if (colorVariables.length > 0) {
      swiftOutput += '    struct Colors {\n';
      
      // Group by category if requested
      const grouped = {};
      
      for (const variable of colorVariables) {
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
          swiftOutput += `\n        // ${category.toUpperCase()}\n`;
        }
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'camelCase');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          // Format the color for UIKit
          const r = Math.round(value.r * 255);
          const g = Math.round(value.g * 255);
          const b = Math.round(value.b * 255);
          const a = value.a !== undefined ? value.a.toFixed(2) : '1.0';
          
          swiftOutput += `        static let ${varName} = UIColor(red: ${r}/255.0, green: ${g}/255.0, blue: ${b}/255.0, alpha: ${a})\n`;
        }
      }
      
      swiftOutput += '    }\n\n';
    }
    
    // Process number variables
    if (numberVariables.length > 0) {
      swiftOutput += '    struct Spacing {\n';
      
      // Group by category if requested
      const grouped = {};
      
      for (const variable of numberVariables) {
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
          swiftOutput += `\n        // ${category.toUpperCase()}\n`;
        }
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'camelCase');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          swiftOutput += `        static let ${varName} = CGFloat(${value})\n`;
        }
      }
      
      swiftOutput += '    }\n\n';
    }
    
    // Process string variables
    if (stringVariables.length > 0) {
      swiftOutput += '    struct Strings {\n';
      
      // Group by category if requested
      const grouped = {};
      
      for (const variable of stringVariables) {
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
          swiftOutput += `\n        // ${category.toUpperCase()}\n`;
        }
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'camelCase');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          // Escape quotes
          const escapedValue = value.toString().replace(/"/g, '\\"');
          
          swiftOutput += `        static let ${varName} = "${escapedValue}"\n`;
        }
      }
      
      swiftOutput += '    }\n\n';
    }
    
    // Process boolean variables
    if (booleanVariables.length > 0) {
      swiftOutput += '    struct Flags {\n';
      
      // Group by category if requested
      const grouped = {};
      
      for (const variable of booleanVariables) {
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
          swiftOutput += `\n        // ${category.toUpperCase()}\n`;
        }
        
        for (const variable of vars) {
          // Extract variable name without category prefix
          const parts = variable.name.split(/[\/\s-_]+/);
          const nameWithoutCategory = parts.slice(1).join('-');
          const varName = formatVariableName(nameWithoutCategory, 'camelCase');
          
          // Get the value from the first mode
          const modeId = Object.keys(variable.valuesByMode)[0];
          const value = variable.valuesByMode[modeId];
          
          swiftOutput += `        static let ${varName} = ${value.toString()}\n`;
        }
      }
      
      swiftOutput += '    }\n';
    }
  } else {
    // Flat list organized by type
    
    // Process color variables
    const colorVariables = variables.filter(v => v.type === 'COLOR');
    if (colorVariables.length > 0) {
      swiftOutput += '    struct Colors {\n';
      
      for (const variable of colorVariables) {
        const varName = formatVariableName(variable.name, 'camelCase', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        // Format the color for UIKit
        const r = Math.round(value.r * 255);
        const g = Math.round(value.g * 255);
        const b = Math.round(value.b * 255);
        const a = value.a !== undefined ? value.a.toFixed(2) : '1.0';
        
        swiftOutput += `        static let ${varName} = UIColor(red: ${r}/255.0, green: ${g}/255.0, blue: ${b}/255.0, alpha: ${a})\n`;
      }
      
      swiftOutput += '    }\n\n';
    }
    
    // Process number variables
    const numberVariables = variables.filter(v => ['FLOAT', 'NUMBER'].includes(v.type));
    if (numberVariables.length > 0) {
      swiftOutput += '    struct Spacing {\n';
      
      for (const variable of numberVariables) {
        const varName = formatVariableName(variable.name, 'camelCase', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        swiftOutput += `        static let ${varName} = CGFloat(${value})\n`;
      }
      
      swiftOutput += '    }\n\n';
    }
    
    // Process string variables
    const stringVariables = variables.filter(v => v.type === 'STRING');
    if (stringVariables.length > 0) {
      swiftOutput += '    struct Strings {\n';
      
      for (const variable of stringVariables) {
        const varName = formatVariableName(variable.name, 'camelCase', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        // Escape quotes
        const escapedValue = value.toString().replace(/"/g, '\\"');
        
        swiftOutput += `        static let ${varName} = "${escapedValue}"\n`;
      }
      
      swiftOutput += '    }\n\n';
    }
    
    // Process boolean variables
    const booleanVariables = variables.filter(v => v.type === 'BOOLEAN');
    if (booleanVariables.length > 0) {
      swiftOutput += '    struct Flags {\n';
      
      for (const variable of booleanVariables) {
        const varName = formatVariableName(variable.name, 'camelCase', prefix);
        
        // Get the value from the first mode
        const modeId = Object.keys(variable.valuesByMode)[0];
        const value = variable.valuesByMode[modeId];
        
        swiftOutput += `        static let ${varName} = ${value.toString()}\n`;
      }
      
      swiftOutput += '    }\n';
    }
  }
  
  swiftOutput += '}\n';
  
  return {
    format: 'ios',
    variables: variables.length,
    code: swiftOutput
  };
}

// Process tokens from JSON format (custom JSON format)
function processJsonTokens(parsedTokens) {
  const variables = [];
  
  // Helper function to process a token
  function processToken(token, name, path = []) {
    // Skip if token is not an object
    if (typeof token !== 'object' || token === null) {
      return;
    }
    
    // Check if token has a value property (or is a nested object)
    if ('value' in token) {
      // This is a token, add to variables
      const variable = {
        name: path.length > 0 ? path.join('/') : name,
        valuesByMode: {}
      };
      
      // Determine token type
      if (typeof token.value === 'string' && (
          token.value.startsWith('#') || 
          token.value.startsWith('rgb') || 
          token.value.match(/^#[0-9A-Fa-f]{3,8}$/))) {
        variable.type = 'COLOR';
        
        // Parse color value
        if (token.value.startsWith('#')) {
          const hex = token.value.substring(1);
          let r, g, b, a = 1;
          
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
          } else if (hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
            a = parseInt(hex.substring(6, 8), 16) / 255;
          }
          
          variable.valuesByMode['default'] = { r, g, b, a };
        } else if (token.value.startsWith('rgb')) {
          // Parse rgb/rgba color
          const match = token.value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
          if (match) {
            const r = parseInt(match[1]) / 255;
            const g = parseInt(match[2]) / 255;
            const b = parseInt(match[3]) / 255;
            const a = match[4] ? parseFloat(match[4]) : 1;
            
            variable.valuesByMode['default'] = { r, g, b, a };
          }
        }
      } else if (typeof token.value === 'number' || token.value.match(/^[\d.]+(?:px|rem|em)?$/)) {
        variable.type = 'FLOAT';
        
        // Parse numeric value
        let value;
        if (typeof token.value === 'number') {
          value = token.value;
        } else {
          value = parseFloat(token.value);
        }
        
        variable.valuesByMode['default'] = value;
      } else if (typeof token.value === 'boolean') {
        variable.type = 'BOOLEAN';
        variable.valuesByMode['default'] = token.value;
      } else {
        variable.type = 'STRING';
        variable.valuesByMode['default'] = token.value.toString();
      }
      
      // Add modes if available
      if (token.modes) {
        for (const [mode, value] of Object.entries(token.modes)) {
          variable.valuesByMode[mode] = value;
        }
      }
      
      variables.push(variable);
    } else {
      // This is a nested object, process recursively
      for (const [key, value] of Object.entries(token)) {
        const newPath = [...path, key];
        
        if (typeof value === 'object' && value !== null) {
          // Nested object
          processToken(value, key, newPath);
        } else {
          // Leaf value
          const variable = {
            name: newPath.join('/'),
            valuesByMode: { 'default': value }
          };
          
          // Determine type
          if (typeof value === 'string' && (
              value.startsWith('#') || 
              value.startsWith('rgb') || 
              value.match(/^#[0-9A-Fa-f]{3,8}$/))) {
            variable.type = 'COLOR';
            
            // Parse color value
            if (value.startsWith('#')) {
              const hex = value.substring(1);
              let r, g, b, a = 1;
              
              if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16) / 255;
                g = parseInt(hex[1] + hex[1], 16) / 255;
                b = parseInt(hex[2] + hex[2], 16) / 255;
              } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16) / 255;
                g = parseInt(hex.substring(2, 4), 16) / 255;
                b = parseInt(hex.substring(4, 6), 16) / 255;
              } else if (hex.length === 8) {
                r = parseInt(hex.substring(0, 2), 16) / 255;
                g = parseInt(hex.substring(2, 4), 16) / 255;
                b = parseInt(hex.substring(4, 6), 16) / 255;
                a = parseInt(hex.substring(6, 8), 16) / 255;
              }
              
              variable.valuesByMode['default'] = { r, g, b, a };
            } else if (value.startsWith('rgb')) {
              // Parse rgb/rgba color
              const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
              if (match) {
                const r = parseInt(match[1]) / 255;
                const g = parseInt(match[2]) / 255;
                const b = parseInt(match[3]) / 255;
                const a = match[4] ? parseFloat(match[4]) : 1;
                
                variable.valuesByMode['default'] = { r, g, b, a };
              }
            }
          } else if (typeof value === 'number' || (typeof value === 'string' && value.match(/^[\d.]+(?:px|rem|em)?$/))) {
            variable.type = 'FLOAT';
            
            // Parse numeric value
            let numValue;
            if (typeof value === 'number') {
              numValue = value;
            } else {
              numValue = parseFloat(value);
            }
            
            variable.valuesByMode['default'] = numValue;
          } else if (typeof value === 'boolean') {
            variable.type = 'BOOLEAN';
            variable.valuesByMode['default'] = value;
          } else {
            variable.type = 'STRING';
            variable.valuesByMode['default'] = value.toString();
          }
          
          variables.push(variable);
        }
      }
    }
  }
  
  // Process the root token object
  for (const [key, value] of Object.entries(parsedTokens)) {
    processToken(value, key, [key]);
  }
  
  return variables;
}

// Process tokens from CSS variables
function processCssTokens(cssText) {
  const variables = [];
  
  // Parse CSS variables from the text
  const varRegex = /--([^:]+):\s*([^;]+);/g;
  let match;
  
  while ((match = varRegex.exec(cssText)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    
    const variable = {
      name,
      valuesByMode: { 'default': value }
    };
    
    // Determine type based on value
    if (value.startsWith('#') || value.startsWith('rgb') || value.match(/^#[0-9A-Fa-f]{3,8}$/)) {
      variable.type = 'COLOR';
      
      // Parse color value
      if (value.startsWith('#')) {
        const hex = value.substring(1);
        let r, g, b, a = 1;
        
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16) / 255;
          g = parseInt(hex[1] + hex[1], 16) / 255;
          b = parseInt(hex[2] + hex[2], 16) / 255;
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
        } else if (hex.length === 8) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
          a = parseInt(hex.substring(6, 8), 16) / 255;
        }
        
        variable.valuesByMode['default'] = { r, g, b, a };
      } else if (value.startsWith('rgb')) {
        // Parse rgb/rgba color
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (match) {
          const r = parseInt(match[1]) / 255;
          const g = parseInt(match[2]) / 255;
          const b = parseInt(match[3]) / 255;
          const a = match[4] ? parseFloat(match[4]) : 1;
          
          variable.valuesByMode['default'] = { r, g, b, a };
        }
      }
    } else if (value.match(/^[\d.]+(?:px|rem|em)?$/)) {
      variable.type = 'FLOAT';
      
      // Extract the numeric part
      const numValue = parseFloat(value);
      variable.valuesByMode['default'] = numValue;
    } else if (value === 'true' || value === 'false') {
      variable.type = 'BOOLEAN';
      variable.valuesByMode['default'] = value === 'true';
    } else {
      variable.type = 'STRING';
      variable.valuesByMode['default'] = value;
    }
    
    variables.push(variable);
  }
  
  return variables;
}

// Process tokens from SCSS variables
function processScssTokens(scssText) {
  const variables = [];
  
  // Parse SCSS variables from the text
  const varRegex = /\$([^:]+):\s*([^;]+);/g;
  let match;
  
  while ((match = varRegex.exec(scssText)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();
    
    const variable = {
      name,
      valuesByMode: { 'default': value }
    };
    
    // Determine type based on value
    if (value.startsWith('#') || value.startsWith('rgb') || value.match(/^#[0-9A-Fa-f]{3,8}$/)) {
      variable.type = 'COLOR';
      
      // Parse color value
      if (value.startsWith('#')) {
        const hex = value.substring(1);
        let r, g, b, a = 1;
        
        if (hex.length === 3) {
          r = parseInt(hex[0] + hex[0], 16) / 255;
          g = parseInt(hex[1] + hex[1], 16) / 255;
          b = parseInt(hex[2] + hex[2], 16) / 255;
        } else if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
        } else if (hex.length === 8) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
          a = parseInt(hex.substring(6, 8), 16) / 255;
        }
        
        variable.valuesByMode['default'] = { r, g, b, a };
      } else if (value.startsWith('rgb')) {
        // Parse rgb/rgba color
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (match) {
          const r = parseInt(match[1]) / 255;
          const g = parseInt(match[2]) / 255;
          const b = parseInt(match[3]) / 255;
          const a = match[4] ? parseFloat(match[4]) : 1;
          
          variable.valuesByMode['default'] = { r, g, b, a };
        }
      }
    } else if (value.match(/^[\d.]+(?:px|rem|em)?$/)) {
      variable.type = 'FLOAT';
      
      // Extract the numeric part
      const numValue = parseFloat(value);
      variable.valuesByMode['default'] = numValue;
    } else if (value === 'true' || value === 'false') {
      variable.type = 'BOOLEAN';
      variable.valuesByMode['default'] = value === 'true';
    } else {
      variable.type = 'STRING';
      variable.valuesByMode['default'] = value;
    }
    
    variables.push(variable);
  }
  
  return variables;
}

// Process tokens from JavaScript objects
function processJsTokens(jsObject) {
  const variables = [];
  
  // Helper function to process a token object
  function processToken(token, name, path = []) {
    // Skip if token is not an object
    if (typeof token !== 'object' || token === null) {
      return;
    }
    
    // Check if the object has properties like "value" or is just a plain object with nested tokens
    if ('value' in token) {
      // This is a token, add to variables
      const variable = {
        name: path.length > 0 ? path.join('/') : name,
        valuesByMode: {}
      };
      
      // Determine token type
      if (typeof token.value === 'string' && (
          token.value.startsWith('#') || 
          token.value.startsWith('rgb') || 
          token.value.match(/^#[0-9A-Fa-f]{3,8}$/))) {
        variable.type = 'COLOR';
        
        // Parse color value
        if (token.value.startsWith('#')) {
          const hex = token.value.substring(1);
          let r, g, b, a = 1;
          
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
          } else if (hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
            a = parseInt(hex.substring(6, 8), 16) / 255;
          }
          
          variable.valuesByMode['default'] = { r, g, b, a };
        } else if (token.value.startsWith('rgb')) {
          // Parse rgb/rgba color
          const match = token.value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
          if (match) {
            const r = parseInt(match[1]) / 255;
            const g = parseInt(match[2]) / 255;
            const b = parseInt(match[3]) / 255;
            const a = match[4] ? parseFloat(match[4]) : 1;
            
            variable.valuesByMode['default'] = { r, g, b, a };
          }
        }
      } else if (typeof token.value === 'number' || 
                 (typeof token.value === 'string' && token.value.match(/^[\d.]+(?:px|rem|em)?$/))) {
        variable.type = 'FLOAT';
        
        // Parse numeric value
        let numValue;
        if (typeof token.value === 'number') {
          numValue = token.value;
        } else {
          numValue = parseFloat(token.value);
        }
        
        variable.valuesByMode['default'] = numValue;
      } else if (typeof token.value === 'boolean') {
        variable.type = 'BOOLEAN';
        variable.valuesByMode['default'] = token.value;
      } else {
        variable.type = 'STRING';
        variable.valuesByMode['default'] = token.value.toString();
      }
      
      variables.push(variable);
    } else {
      // This is a nested object, process recursively
      for (const [key, value] of Object.entries(token)) {
        const newPath = [...path, key];
        
        if (typeof value === 'object' && value !== null) {
          // Nested object
          processToken(value, key, newPath);
        } else {
          // Leaf value
          const variable = {
            name: newPath.join('/'),
            valuesByMode: { 'default': value }
          };
          
          // Determine type
          if (typeof value === 'string' && (
              value.startsWith('#') || 
              value.startsWith('rgb') || 
              value.match(/^#[0-9A-Fa-f]{3,8}$/))) {
            variable.type = 'COLOR';
            
            // Parse color value
            if (value.startsWith('#')) {
              const hex = value.substring(1);
              let r, g, b, a = 1;
              
              if (hex.length === 3) {
                r = parseInt(hex[0] + hex[0], 16) / 255;
                g = parseInt(hex[1] + hex[1], 16) / 255;
                b = parseInt(hex[2] + hex[2], 16) / 255;
              } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16) / 255;
                g = parseInt(hex.substring(2, 4), 16) / 255;
                b = parseInt(hex.substring(4, 6), 16) / 255;
              } else if (hex.length === 8) {
                r = parseInt(hex.substring(0, 2), 16) / 255;
                g = parseInt(hex.substring(2, 4), 16) / 255;
                b = parseInt(hex.substring(4, 6), 16) / 255;
                a = parseInt(hex.substring(6, 8), 16) / 255;
              }
              
              variable.valuesByMode['default'] = { r, g, b, a };
            } else if (value.startsWith('rgb')) {
              // Parse rgb/rgba color
              const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
              if (match) {
                const r = parseInt(match[1]) / 255;
                const g = parseInt(match[2]) / 255;
                const b = parseInt(match[3]) / 255;
                const a = match[4] ? parseFloat(match[4]) : 1;
                
                variable.valuesByMode['default'] = { r, g, b, a };
              }
            }
          } else if (typeof value === 'number' || 
                     (typeof value === 'string' && value.match(/^[\d.]+(?:px|rem|em)?$/))) {
            variable.type = 'FLOAT';
            
            // Parse numeric value
            let numValue;
            if (typeof value === 'number') {
              numValue = value;
            } else {
              numValue = parseFloat(value);
            }
            
            variable.valuesByMode['default'] = numValue;
          } else if (typeof value === 'boolean') {
            variable.type = 'BOOLEAN';
            variable.valuesByMode['default'] = value;
          } else {
            variable.type = 'STRING';
            variable.valuesByMode['default'] = value.toString();
          }
          
          variables.push(variable);
        }
      }
    }
  }
  
  // Process the root token object
  processToken(jsObject, '', []);
  
  return variables;
}

// Process tokens from Tailwind config
function processTailwindTokens(tailwindConfig) {
  const variables = [];
  
  // Look for theme definition
  if (tailwindConfig.theme && tailwindConfig.theme.extend) {
    // Process colors
    if (tailwindConfig.theme.extend.colors) {
      processColors('colors', tailwindConfig.theme.extend.colors);
    }
    
    // Process spacing
    if (tailwindConfig.theme.extend.spacing) {
      processSpacing('spacing', tailwindConfig.theme.extend.spacing);
    }
  } else if (tailwindConfig.theme) {
    // Process colors
    if (tailwindConfig.theme.colors) {
      processColors('colors', tailwindConfig.theme.colors);
    }
    
    // Process spacing
    if (tailwindConfig.theme.spacing) {
      processSpacing('spacing', tailwindConfig.theme.spacing);
    }
  }
  
  // Helper function to process colors
  function processColors(category, colors, path = []) {
    for (const [key, value] of Object.entries(colors)) {
      const currentPath = [...path, key];
      
      if (typeof value === 'string' && (
          value.startsWith('#') || 
          value.startsWith('rgb') || 
          value.match(/^#[0-9A-Fa-f]{3,8}$/))) {
        // This is a color value
        const variable = {
          name: category + '/' + currentPath.join('/'),
          type: 'COLOR',
          valuesByMode: {}
        };
        
        // Parse color value
        if (value.startsWith('#')) {
          const hex = value.substring(1);
          let r, g, b, a = 1;
          
          if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16) / 255;
            g = parseInt(hex[1] + hex[1], 16) / 255;
            b = parseInt(hex[2] + hex[2], 16) / 255;
          } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
          } else if (hex.length === 8) {
            r = parseInt(hex.substring(0, 2), 16) / 255;
            g = parseInt(hex.substring(2, 4), 16) / 255;
            b = parseInt(hex.substring(4, 6), 16) / 255;
            a = parseInt(hex.substring(6, 8), 16) / 255;
          }
          
          variable.valuesByMode['default'] = { r, g, b, a };
        } else if (value.startsWith('rgb')) {
          // Parse rgb/rgba color
          const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
          if (match) {
            const r = parseInt(match[1]) / 255;
            const g = parseInt(match[2]) / 255;
            const b = parseInt(match[3]) / 255;
            const a = match[4] ? parseFloat(match[4]) : 1;
            
            variable.valuesByMode['default'] = { r, g, b, a };
          }
        }
        
        variables.push(variable);
      } else if (typeof value === 'object' && value !== null) {
        // This is a nested object, process recursively
        processColors(category, value, currentPath);
      }
    }
  }
  
  // Helper function to process spacing
  function processSpacing(category, spacing) {
    for (const [key, value] of Object.entries(spacing)) {
      if (typeof value === 'string' && value.match(/^[\d.]+(?:px|rem|em)?$/)) {
        // This is a spacing value
        const variable = {
          name: category + '/' + key,
          type: 'FLOAT',
          valuesByMode: {}
        };
        
        // Parse numeric value
        const numValue = parseFloat(value);
        variable.valuesByMode['default'] = numValue;
        
        variables.push(variable);
      } else if (typeof value === 'number') {
        // This is a numeric spacing value
        const variable = {
          name: category + '/' + key,
          type: 'FLOAT',
          valuesByMode: {}
        };
        
        variable.valuesByMode['default'] = value;
        
        variables.push(variable);
      }
    }
  }
  
  return variables;
}

// Process tokens from Android resources
function processAndroidTokens(androidResources) {
  const variables = [];
  
  // Process each resource file
  for (const resourceFile of Object.values(androidResources)) {
    // Parse XML file
    const xmlString = resourceFile;
    
    // Extract resource type and values
    if (xmlString.includes('<color ')) {
      // Process colors
      const colorRegex = /<color\s+name="([^"]+)">(#[0-9a-fA-F]+)<\/color>/g;
      let match;
      
      while ((match = colorRegex.exec(xmlString)) !== null) {
        const name = match[1].trim();
        const value = match[2].trim();
        
        const variable = {
          name: 'color/' + name,
          type: 'COLOR',
          valuesByMode: {}
        };
        
        // Parse color value
        const hex = value.substring(1);
        let r, g, b, a = 1;
        
        if (hex.length === 6) {
          r = parseInt(hex.substring(0, 2), 16) / 255;
          g = parseInt(hex.substring(2, 4), 16) / 255;
          b = parseInt(hex.substring(4, 6), 16) / 255;
        } else if (hex.length === 8) {
          // ARGB format (Android)
          a = parseInt(hex.substring(0, 2), 16) / 255;
          r = parseInt(hex.substring(2, 4), 16) / 255;
          g = parseInt(hex.substring(4, 6), 16) / 255;
          b = parseInt(hex.substring(6, 8), 16) / 255;
        }
        
        variable.valuesByMode['default'] = { r, g, b, a };
        
        variables.push(variable);
      }
    } else if (xmlString.includes('<dimen ')) {
      // Process dimensions
      const dimenRegex = /<dimen\s+name="([^"]+)">([0-9.]+)(\w+)<\/dimen>/g;
      let match;
      
      while ((match = dimenRegex.exec(xmlString)) !== null) {
        const name = match[1].trim();
        const value = parseFloat(match[2]);
        const unit = match[3];
        
        const variable = {
          name: 'spacing/' + name,
          type: 'FLOAT',
          valuesByMode: {}
        };
        
        // Convert units
        if (unit === 'dp' || unit === 'dip') {
          // density-independent pixels (close to logical pixels)
          variable.valuesByMode['default'] = value;
        } else if (unit === 'sp') {
          // scale-independent pixels (for text)
          variable.valuesByMode['default'] = value;
        } else if (unit === 'px') {
          // physical pixels
          variable.valuesByMode['default'] = value;
        } else {
          variable.valuesByMode['default'] = value;
        }
        
        variables.push(variable);
      }
    } else if (xmlString.includes('<string ')) {
      // Process strings
      const stringRegex = /<string\s+name="([^"]+)">(.*?)<\/string>/g;
      let match;
      
      while ((match = stringRegex.exec(xmlString)) !== null) {
        const name = match[1].trim();
        const value = match[2].trim()
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
        
        const variable = {
          name: 'string/' + name,
          type: 'STRING',
          valuesByMode: {}
        };
        
        variable.valuesByMode['default'] = value;
        
        variables.push(variable);
      }
    } else if (xmlString.includes('<bool ')) {
      // Process booleans
      const boolRegex = /<bool\s+name="([^"]+)">(true|false)<\/bool>/g;
      let match;
      
      while ((match = boolRegex.exec(xmlString)) !== null) {
        const name = match[1].trim();
        const value = match[2].trim() === 'true';
        
        const variable = {
          name: 'boolean/' + name,
          type: 'BOOLEAN',
          valuesByMode: {}
        };
        
        variable.valuesByMode['default'] = value;
        
        variables.push(variable);
      }
    }
  }
  
  return variables;
}

// Process tokens from iOS Swift
function processIosTokens(swiftCode) {
  const variables = [];
  
  // Process color variables
  const colorRegex = /static\s+let\s+(\w+)\s+=\s+UIColor\(red:\s+([0-9.]+)\/255\.0,\s+green:\s+([0-9.]+)\/255\.0,\s+blue:\s+([0-9.]+)\/255\.0,\s+alpha:\s+([0-9.]+)\)/g;
  let match;
  
  while ((match = colorRegex.exec(swiftCode)) !== null) {
    const name = match[1].trim();
    const r = parseFloat(match[2]) / 255;
    const g = parseFloat(match[3]) / 255;
    const b = parseFloat(match[4]) / 255;
    const a = parseFloat(match[5]);
    
    const variable = {
      name: 'color/' + name,
      type: 'COLOR',
      valuesByMode: {}
    };
    
    variable.valuesByMode['default'] = { r, g, b, a };
    
    variables.push(variable);
  }
  
  // Process number variables
  const numberRegex = /static\s+let\s+(\w+)\s+=\s+CGFloat\(([0-9.]+)\)/g;
  
  while ((match = numberRegex.exec(swiftCode)) !== null) {
    const name = match[1].trim();
    const value = parseFloat(match[2]);
    
    const variable = {
      name: 'spacing/' + name,
      type: 'FLOAT',
      valuesByMode: {}
    };
    
    variable.valuesByMode['default'] = value;
    
    variables.push(variable);
  }
  
  // Process string variables
  const stringRegex = /static\s+let\s+(\w+)\s+=\s+"([^"]*)"/g;
  
  while ((match = stringRegex.exec(swiftCode)) !== null) {
    const name = match[1].trim();
    const value = match[2].replace(/\\"/g, '"');
    
    const variable = {
      name: 'string/' + name,
      type: 'STRING',
      valuesByMode: {}
    };
    
    variable.valuesByMode['default'] = value;
    
    variables.push(variable);
  }
  
  // Process boolean variables
  const boolRegex = /static\s+let\s+(\w+)\s+=\s+(true|false)/g;
  
  while ((match = boolRegex.exec(swiftCode)) !== null) {
    const name = match[1].trim();
    const value = match[2] === 'true';
    
    const variable = {
      name: 'boolean/' + name,
      type: 'BOOLEAN',
      valuesByMode: {}
    };
    
    variable.valuesByMode['default'] = value;
    
    variables.push(variable);
  }
  
  return variables;
}

// Import tokens to Figma
function importTokensToFigma(processedTokens, options) {
  const { prefix, nameFormat } = options;
  
  // Group tokens by type and category
  const colorTokens = processedTokens.filter(t => t.type === 'COLOR');
  const numberTokens = processedTokens.filter(t => ['FLOAT', 'NUMBER'].includes(t.type));
  const stringTokens = processedTokens.filter(t => t.type === 'STRING');
  const booleanTokens = processedTokens.filter(t => t.type === 'BOOLEAN');
  
  // Get all modes from the tokens
  const modes = new Set();
  processedTokens.forEach(token => {
    Object.keys(token.valuesByMode).forEach(mode => {
      modes.add(mode);
    });
  });
  
  // Create collections
  const collections = [];
  const collectionMap = {};
  
  // Helper function to create a collection if it doesn't exist
  function getOrCreateCollection(name) {
    if (collectionMap[name]) {
      return collectionMap[name];
    }
    
    try {
      // Create the collection with all modes
      const collection = figma.variables.createVariableCollection(name);
      
      // Add modes
      const modeNames = Array.from(modes);
      for (let i = 1; i < modeNames.length; i++) {
        collection.addMode(modeNames[i]);
      }
      
      collections.push({
        collection,
        name
      });
      
      collectionMap[name] = collection;
      return collection;
    } catch (error) {
      console.error(`Failed to create collection ${name}:`, error);
      return null;
    }
  }
  
  // Create collections and variables
  const variables = [];
  
  // Process color tokens
  if (colorTokens.length > 0) {
    const collection = getOrCreateCollection('Colors');
    
    if (collection) {
      for (const token of colorTokens) {
        try {
          // Format variable name
          const varName = formatVariableName(token.name, nameFormat, prefix);
          
          // Create the variable
          const variable = figma.variables.createVariable(varName, collection, 'COLOR');
          
          // Set values for each mode
          for (const [modeName, value] of Object.entries(token.valuesByMode)) {
            const modeId = collection.modes.find(m => m.name === modeName)?.modeId || collection.defaultModeId;
            variable.setValueForMode(modeId, value);
          }
          
          variables.push({
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType
          });
        } catch (error) {
          console.error(`Failed to create variable ${token.name}:`, error);
        }
      }
    }
  }
  
  // Process number tokens
  if (numberTokens.length > 0) {
    const collection = getOrCreateCollection('Spacing');
    
    if (collection) {
      for (const token of numberTokens) {
        try {
          // Format variable name
          const varName = formatVariableName(token.name, nameFormat, prefix);
          
          // Create the variable
          const variable = figma.variables.createVariable(varName, collection, 'FLOAT');
          
          // Set values for each mode
          for (const [modeName, value] of Object.entries(token.valuesByMode)) {
            const modeId = collection.modes.find(m => m.name === modeName)?.modeId || collection.defaultModeId;
            variable.setValueForMode(modeId, value);
          }
          
          variables.push({
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType
          });
        } catch (error) {
          console.error(`Failed to create variable ${token.name}:`, error);
        }
      }
    }
  }
  
  // Process string tokens
  if (stringTokens.length > 0) {
    const collection = getOrCreateCollection('Strings');
    
    if (collection) {
      for (const token of stringTokens) {
        try {
          // Format variable name
          const varName = formatVariableName(token.name, nameFormat, prefix);
          
          // Create the variable
          const variable = figma.variables.createVariable(varName, collection, 'STRING');
          
          // Set values for each mode
          for (const [modeName, value] of Object.entries(token.valuesByMode)) {
            const modeId = collection.modes.find(m => m.name === modeName)?.modeId || collection.defaultModeId;
            variable.setValueForMode(modeId, value);
          }
          
          variables.push({
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType
          });
        } catch (error) {
          console.error(`Failed to create variable ${token.name}:`, error);
        }
      }
    }
  }
  
  // Process boolean tokens
  if (booleanTokens.length > 0) {
    const collection = getOrCreateCollection('Flags');
    
    if (collection) {
      for (const token of booleanTokens) {
        try {
          // Format variable name
          const varName = formatVariableName(token.name, nameFormat, prefix);
          
          // Create the variable
          const variable = figma.variables.createVariable(varName, collection, 'BOOLEAN');
          
          // Set values for each mode
          for (const [modeName, value] of Object.entries(token.valuesByMode)) {
            const modeId = collection.modes.find(m => m.name === modeName)?.modeId || collection.defaultModeId;
            variable.setValueForMode(modeId, value);
          }
          
          variables.push({
            id: variable.id,
            name: variable.name,
            type: variable.resolvedType
          });
        } catch (error) {
          console.error(`Failed to create variable ${token.name}:`, error);
        }
      }
    }
  }
  
  return {
    format: 'figma',
    variables: variables.length,
    collections: collections.length,
    modes: modes.size,
    result: {
      collections: collections.map(c => ({
        id: c.collection.id,
        name: c.name,
        modes: c.collection.modes.map(m => m.name)
      })),
      variables: variables
    }
  };
}

// Export all utility functions
module.exports = {
  // Conversion helpers
  formatVariableName,
  getCssColorValue,
  
  // Converters from Figma to other formats
  convertToCss,
  convertToScss,
  convertToJs,
  convertToJson,
  convertToTailwind,
  convertToAndroid,
  convertToIos,
  
  // Parsers for other formats to convert to Figma
  processJsonTokens,
  processCssTokens,
  processScssTokens,
  processJsTokens,
  processTailwindTokens,
  processAndroidTokens,
  processIosTokens,
  
  // Import to Figma
  importTokensToFigma
};
