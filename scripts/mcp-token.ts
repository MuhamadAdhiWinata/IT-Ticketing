// Usage: npx tsx -r dotenv/config scripts/mcp-token.ts create <userId> [name] | list | revoke <tokenId>
import { createMcpToken, listMcpTokens, revokeMcpToken } from '../server/services/ticketing/mcp-auth';

const [cmd, a, b] = process.argv.slice(2);

(async () => {
  if (cmd === 'create' && a) {
    const { id, token } = await createMcpToken(a, b || 'mcp-client');
    console.log(`id:    ${id}\ntoken: ${token}\n(token hanya ditampilkan sekali)`);
  } else if (cmd === 'list') {
    console.table(await listMcpTokens());
  } else if (cmd === 'revoke' && a) {
    console.log((await revokeMcpToken(a)) ? 'revoked' : 'tidak ditemukan / sudah dicabut');
  } else {
    console.error('Usage: create <userId> [name] | list | revoke <tokenId>');
    process.exitCode = 1;
  }
  process.exit();
})();
