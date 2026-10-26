import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticateMcp } from '~/server/services/ticketing/mcp-auth';
import { buildMcpServer } from '~/server/mcp/server';

// Stateless Streamable HTTP: server + transport baru per request, actor dari token API.
export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    setResponseStatus(event, 405);
    setHeader(event, 'Allow', 'POST');
    return { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null };
  }

  const actor = await authenticateMcp(getHeader(event, 'authorization'));
  if (!actor) {
    setResponseStatus(event, 401);
    setHeader(event, 'WWW-Authenticate', 'Bearer realm="it-ticketing-mcp"');
    return { jsonrpc: '2.0', error: { code: -32001, message: 'Unauthorized' }, id: null };
  }

  const body = await readBody(event);
  const server = buildMcpServer(actor);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  event.node.res.on('close', () => { transport.close(); server.close(); });

  await server.connect(transport);
  await transport.handleRequest(event.node.req, event.node.res, body);
  event._handled = true;
});
