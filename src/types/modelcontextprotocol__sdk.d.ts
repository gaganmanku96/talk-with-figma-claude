declare module '@modelcontextprotocol/sdk' {
  export class MCPServer {
    constructor(options: any);
    start(): Promise<void>;
    // Add other methods as needed
  }
  // Add other exports as needed
}