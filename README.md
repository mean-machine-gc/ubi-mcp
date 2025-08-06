# ubi-mcp

Official MCP (Model Context Protocol) server for the Ubi Framework.

## Usage

Run the MCP server directly without installation:

```bash
npx -y ubi-mcp
```

## Configuration

### Claude Desktop

Add the following to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ubi-mcp": {
      "command": "npx",
      "args": ["-y", "ubi-mcp"]
    }
  }
}
```

### Other MCP Clients

For other MCP-compatible clients, use the following command configuration:
- Command: `npx`
- Arguments: `["-y", "ubi-mcp"]`

## License

MIT