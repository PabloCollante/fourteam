import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const frontDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backDir = path.resolve(frontDir, '..', 'back');
const backend = spawn(process.execPath, [path.join(backDir, 'server.js')], {
  cwd: backDir,
  stdio: 'inherit',
});
const frontend = spawn(process.execPath, [path.join(frontDir, 'node_modules', 'vite', 'bin', 'vite.js'), '--open'], {
  cwd: frontDir,
  stdio: 'inherit',
});

let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  backend.kill();
  frontend.kill();
}

backend.on('error', (error) => {
  console.error('No se pudo iniciar el backend:', error.message);
  stop(1);
});
frontend.on('error', (error) => {
  console.error('No se pudo iniciar Vite:', error.message);
  stop(1);
});
backend.on('exit', (code) => {
  if (!stopping) {
    console.error('El backend se detuvo. Revisá el error anterior para poder iniciar sesión.');
    stop(code || 1);
  }
});
frontend.on('exit', (code) => stop(code || 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
