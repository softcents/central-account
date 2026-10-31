const http = require('http');
const { exec } = require('child_process');

const FRONTEND_URL = 'http://127.0.0.1:3000';
const API_URL = 'http://127.0.0.1:4000/api';
const DISPLAY_URL = 'http://localhost:3000';

const CHECK_INTERVAL_MS = 1000;
const MAX_ATTEMPTS = 120; // 2 minutes max

let attempts = 0;
let frontendReady = false;
let apiReady = false;

function ping(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function checkServers() {
  attempts++;

  if (!frontendReady) {
    frontendReady = await ping(FRONTEND_URL);
  }
  if (!apiReady) {
    apiReady = await ping(API_URL);
  }

  if (frontendReady && apiReady) {
    console.log('\n=============================================================');
    console.log('  🚀 Central Account Platform is fully up and running!');
    console.log('  🌐 Frontend:          http://localhost:3000');
    console.log('  🛠️  Backend API:       http://localhost:4000/api');
    console.log('  👁️  Face Verification: http://localhost:8000/docs');
    console.log('=============================================================\n');
    console.log(`[Browser] Opening ${DISPLAY_URL} in your default browser...\n`);
    openBrowser(DISPLAY_URL);
    return;
  }

  // If frontend is ready and after 25 attempts API still not flagged, proceed to open
  if (frontendReady && attempts > 25) {
    console.log(`[Browser] Opening ${DISPLAY_URL} in your default browser...\n`);
    openBrowser(DISPLAY_URL);
    return;
  }

  if (attempts >= MAX_ATTEMPTS) {
    console.log(`[Browser] Server startup check timed out. Please open ${DISPLAY_URL} manually.`);
    process.exit(0);
  }

  setTimeout(checkServers, CHECK_INTERVAL_MS);
}

function openBrowser(url) {
  const platform = process.platform;
  let command = '';

  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.warn(`[Browser] Could not auto-launch browser: ${error.message}`);
    } else {
      console.log('[Browser] Browser launched successfully.');
    }
    process.exit(0);
  });
}

console.log('[Browser] Waiting for Frontend (port 3000) and Backend (port 4000) to come online...');
setTimeout(checkServers, 1500);
