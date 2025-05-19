// figma-bridge-modified.js
const http = require('http');
const readline = require('readline');

// Configuration - now without /sse
const FIGMA_SERVER_URL = 'http://localhost:3700/mcp'; 
console.error(`Starting custom bridge to connect to ${FIGMA_SERVER_URL}`);

// Set up stdin/stdout for MCP stdio communication
process.stdin.setEncoding('utf8');
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false
});

// Connect to the SSE endpoint
let connectionActive = false;

function connectToSSE() {
  console.error('Connecting to Figma server...');
  
  // Create HTTP request to the base URL instead of /sse
  const req = http.request(FIGMA_SERVER_URL, {
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  });

  req.on('response', (res) => {
    console.error(`Connected to Figma server. Status: ${res.statusCode}`);
    connectionActive = true;
    
    // Process incoming events
    res.setEncoding('utf8');
    let buffer = '';
    
    res.on('data', (chunk) => {
      console.error('Received data from Figma server');
      buffer += chunk;
      
      try {
        // Try to parse as JSON, assuming MCP messages
        const messages = buffer.split('\n');
        buffer = ''; // Clear buffer after processing
        
        for (const message of messages) {
          if (!message.trim()) continue;
          
          try {
            // Try to parse each line as JSON
            const parsed = JSON.parse(message);
            console.error('Successfully parsed message from Figma server');
            // Forward to Claude
            process.stdout.write(message + '\n');
          } catch (parseErr) {
            // Not JSON, might be partial data or other format
            console.error('Error parsing message, skipping:', parseErr.message);
          }
        }
      } catch (err) {
        console.error('Error processing data:', err);
      }
    });
    
    res.on('error', (err) => {
      console.error('Connection error:', err);
      connectionActive = false;
      setTimeout(connectToSSE, 3000); // Retry connection
    });
    
    res.on('end', () => {
      console.error('Connection closed');
      connectionActive = false;
      setTimeout(connectToSSE, 3000); // Retry connection
    });
  });
  
  req.on('error', (err) => {
    console.error('Failed to connect to Figma server:', err);
    connectionActive = false;
    setTimeout(connectToSSE, 3000); // Retry connection
  });
  
  req.end();
}

// Handle messages from Claude (stdin)
rl.on('line', async (line) => {
  if (!line) return;
  
  try {
    console.error('Received message from Claude, forwarding to TalkToFigma');
    
    // Forward Claude's message to TalkToFigma server
    const req = http.request(FIGMA_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    req.on('error', (err) => {
      console.error('Error sending message to TalkToFigma:', err);
      
      // Send error response to Claude
      try {
        const parsedLine = JSON.parse(line);
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: parsedLine.id,
          error: {
            code: -32000,
            message: `Failed to communicate with TalkToFigma: ${err.message}`
          }
        }) + '\n');
      } catch (parseErr) {
        console.error('Error parsing input from Claude:', parseErr);
      }
    });
    
    // We need to parse the response carefully since it might be HTML
    req.on('response', (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (responseData) {
          console.error('Received response from TalkToFigma');
          // Check if it's JSON before trying to parse
          if (responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
            try {
              // Try to parse as JSON and validate
              const parsed = JSON.parse(responseData);
              // Forward to Claude if it's valid JSON
              process.stdout.write(responseData + '\n');
            } catch (err) {
              console.error('Response is not valid JSON:', err.message);
              // Send an error response to Claude
              try {
                const parsedLine = JSON.parse(line);
                process.stdout.write(JSON.stringify({
                  jsonrpc: '2.0',
                  id: parsedLine.id,
                  error: {
                    code: -32001,
                    message: 'TalkToFigma returned an invalid response'
                  }
                }) + '\n');
              } catch (parseErr) {
                console.error('Error parsing input from Claude:', parseErr);
              }
            }
          } else {
            console.error('Response is not JSON (likely HTML)');
            // Send an error response to Claude
            try {
              const parsedLine = JSON.parse(line);
              process.stdout.write(JSON.stringify({
                jsonrpc: '2.0',
                id: parsedLine.id,
                error: {
                  code: -32002,
                  message: 'TalkToFigma returned HTML instead of JSON'
                }
              }) + '\n');
            } catch (parseErr) {
              console.error('Error parsing input from Claude:', parseErr);
            }
          }
        }
      });
    });
    
    req.write(line);
    req.end();
  } catch (err) {
    console.error('Error processing input:', err);
  }
});

// Start trying to connect
connectToSSE();

// Handle process termination
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));