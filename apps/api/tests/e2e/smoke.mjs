import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 7790;
const url = `http://localhost:${port}/health`;

const cwd = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const server = spawn('node', ['dist/index.js'], {
  cwd,
  env: { ...process.env, PORT: String(port) },
  stdio: 'inherit'
});

const waitForHealth = async () => {
  for (let i = 0; i < 20; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await delay(250);
  }
  throw new Error('Health check did not respond');
};

try {
  await waitForHealth();
  console.log('E2E smoke: health check ok');
} finally {
  server.kill('SIGTERM');
}
