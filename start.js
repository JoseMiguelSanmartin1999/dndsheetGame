const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=== Starting D&D Sheet Game Services ===');

// Colors for logging
const BACKEND_COLOR = '\x1b[32m';  // Green
const FRONTEND_COLOR = '\x1b[35m'; // Magenta
const ERROR_COLOR = '\x1b[31m';    // Red
const RESET_COLOR = '\x1b[0m';

const backendCwd = path.join(__dirname, 'Backend');
const frontendCwd = path.join(__dirname, 'Frontend');

const frontendScript = path.join('node_modules', '@angular', 'cli', 'bin', 'ng.js');

// Spawn Backend directly via ts-node in watch mode to avoid NestJS CLI ampersand path bugs on Windows
console.log('\x1b[90m%s\x1b[0m', `Launching Backend from: ${backendCwd}`);
const backendProcess = spawn('node', [
  '--env-file=.env',
  '--watch',
  '--watch-path=src',
  '-r', 'tsconfig-paths/register',
  '-r', 'ts-node/register',
  path.join('src', 'main.ts')
], {
  cwd: backendCwd
});

// Spawn Frontend
console.log('\x1b[90m%s\x1b[0m', `Launching Frontend from: ${frontendCwd}`);
const frontendProcess = spawn('node', [frontendScript, 'serve'], {
  cwd: frontendCwd
});

function handleOutput(childProcess, name, color) {
  childProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      const cleanLine = line.replace(/[\r\n]+$/, '').trim();
      if (cleanLine) {
        console.log(`${color}[${name}]${RESET_COLOR} ${cleanLine}`);
      }
    });
  });

  childProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      const cleanLine = line.replace(/[\r\n]+$/, '').trim();
      if (cleanLine) {
        console.error(`${ERROR_COLOR}[${name} ERROR]${RESET_COLOR} ${cleanLine}`);
      }
    });
  });

  childProcess.on('error', (err) => {
    console.error(`${ERROR_COLOR}[${name} CRITICAL ERROR]${RESET_COLOR} Failed to start process:`, err);
    cleanupAndExit(1);
  });

  childProcess.on('close', (code) => {
    console.log(`${color}[${name}]${RESET_COLOR} Process exited with code ${code}`);
    cleanupAndExit(code);
  });
}

handleOutput(backendProcess, 'Backend', BACKEND_COLOR);
handleOutput(frontendProcess, 'Frontend', FRONTEND_COLOR);

let exiting = false;
function cleanupAndExit(code = 0) {
  if (exiting) return;
  exiting = true;
  console.log('\x1b[33m%s\x1b[0m', 'Shutting down all processes...');
  try {
    backendProcess.kill();
  } catch (e) {}
  try {
    frontendProcess.kill();
  } catch (e) {}
  process.exit(code);
}

// Handle process lifecycle termination events
process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
process.on('exit', () => cleanupAndExit(0));
