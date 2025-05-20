#!/bin/bash

echo "Starting Claude Desktop App to Figma connector..."

# Navigate to the script directory
cd "$(dirname "$0")"

# Run the connector script
cd ..
node scripts/claude-start.js

# If the script exits, wait for user input before closing
echo ""
echo "Press any key to close this window..."
read -n 1 -s
