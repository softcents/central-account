const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const faceDir = path.join(rootDir, 'services', 'face-verification');

// Find virtualenv python or fallback to system python
const winVenvPython = path.join(faceDir, 'venv', 'Scripts', 'python.exe');
const unixVenvPython = path.join(faceDir, 'venv', 'bin', 'python');

let pythonBin = 'python';
if (process.platform === 'win32' && fs.existsSync(winVenvPython)) {
  pythonBin = winVenvPython;
} else if (fs.existsSync(unixVenvPython)) {
  pythonBin = unixVenvPython;
}

console.log(`[Face Verification] Using Python binary: ${pythonBin}`);
console.log(`[Face Verification] Working directory: ${faceDir}`);

const args = ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000', '--reload'];

const child = spawn(pythonBin, args, {
  cwd: faceDir,
  stdio: 'inherit',
  env: process.env,
  shell: false,
});

child.on('error', (err) => {
  console.error('[Face Verification] Failed to start process:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});
