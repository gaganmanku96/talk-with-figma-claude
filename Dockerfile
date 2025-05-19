FROM node:18-slim

WORKDIR /app

# Copy package file
COPY package.json ./
# Try to copy package-lock.json, but don't fail if it doesn't exist
COPY package-lock.json* ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose WebSocket server port
EXPOSE 3600

# Run the WebSocket server
CMD ["node", "websocket-server.js"]
