import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { findAvailablePort } from '../server/port.js';

const DEV_API_PORT_FILE = path.join(process.cwd(), '.dev-api-port');

const preferredApiPort = Number(process.env.PORT) || 3001;
const preferredWebPort = Number(process.env.VITE_PORT) || 8080;

async function waitForDevApiPort(timeoutMs = 30000): Promise<number> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(DEV_API_PORT_FILE)) {
      const port = Number(fs.readFileSync(DEV_API_PORT_FILE, 'utf8').trim());
      if (port > 0) return port;
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error('Timeout in attesa dell’avvio del server API');
}

function killProcess(proc: ChildProcess | null): void {
  if (!proc || proc.killed) return;
  proc.kill('SIGTERM');
}

fs.rmSync(DEV_API_PORT_FILE, { force: true });

const webPort = await findAvailablePort(preferredWebPort);

if (webPort !== preferredWebPort) {
  console.log(`Porta ${preferredWebPort} occupata: web su http://localhost:${webPort}`);
}

const apiProcess = spawn('npm', ['run', 'dev:server'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: String(preferredApiPort),
  },
});

let webProcess: ChildProcess | null = null;

try {
  const apiPort = await waitForDevApiPort();

  if (apiPort !== preferredApiPort) {
    console.log(`API pronta su http://localhost:${apiPort}`);
  }

  webProcess = spawn('npm', ['run', 'dev:web'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      API_PORT: String(apiPort),
      VITE_PORT: String(webPort),
    },
  });
} catch (err) {
  killProcess(apiProcess);
  fs.rmSync(DEV_API_PORT_FILE, { force: true });
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

function shutdown(code = 0): void {
  killProcess(apiProcess);
  killProcess(webProcess);
  fs.rmSync(DEV_API_PORT_FILE, { force: true });
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

apiProcess.on('exit', (code) => {
  killProcess(webProcess);
  fs.rmSync(DEV_API_PORT_FILE, { force: true });
  process.exit(code ?? 0);
});

webProcess.on('exit', (code) => {
  killProcess(apiProcess);
  fs.rmSync(DEV_API_PORT_FILE, { force: true });
  process.exit(code ?? 0);
});
