import http from 'node:http';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';

import { setIO } from './src/lib/io';
import { registerSocketHandlers } from './src/lib/socket-server';

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== 'production';
// Bind to all interfaces by default so localhost and external clients both work.
// The system $HOSTNAME env var is intentionally ignored (it would restrict the bind
// to a single interface inside containers/CI). Set HOST to override explicitly.
const hostname = process.env.HOST ?? '0.0.0.0';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();

  const httpServer = http.createServer((req, res) => {
    handle(req, res).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Request handler error', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    });
  });

  const io = new SocketIOServer(httpServer, {
    path: '/socket.io',
    cors: { origin: '*' }
  });

  setIO(io);
  registerSocketHandlers(io);

  httpServer.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`> ready - started server on http://${hostname}:${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', err);
  process.exit(1);
});
