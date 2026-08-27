import http from 'node:http';
import type { Express } from 'express';
import net from 'node:net';

const HOST = '0.0.0.0';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, HOST);
  });
}

export async function findAvailablePort(
  startPort: number,
  maxAttempts = 50
): Promise<number> {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = startPort + offset;
    if (await isPortAvailable(port)) return port;
  }

  throw new Error(`Nessuna porta libera trovata a partire da ${startPort}`);
}

function listen(server: net.Server, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (err: NodeJS.ErrnoException) => {
      server.close(() => reject(err));
    };

    const onListening = () => {
      server.off('error', onError);
      const address = server.address();
      const boundPort =
        typeof address === 'object' && address !== null ? address.port : port;
      resolve(boundPort);
    };

    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, HOST);
  });
}

export async function listenWithFallback(
  app: Express,
  startPort: number,
  maxAttempts = 50
): Promise<number> {
  let port = await findAvailablePort(startPort);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const server = http.createServer(app);
      return await listen(server, port);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err;
      port = await findAvailablePort(port + 1);
    }
  }

  throw new Error(`Nessuna porta libera trovata a partire da ${startPort}`);
}
