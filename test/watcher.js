/**
 * Raqeeb Realtime Watcher (المراقب اللحظي الصامت)
 * Monitors collected/live-errors.jsonl and triggers instant alerts and Waseet sync
 */

const fs = require('fs');
const path = require('path');
const { AI_NAME, TOOL_NAME } = require('./reporter');
const WaseetBridge = require('./waseet_bridge');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COLLECTED_DIR = path.join(PROJECT_ROOT, 'collected');
const LIVE_ERRORS_FILE = path.join(COLLECTED_DIR, 'live-errors.jsonl');

const waseet = new WaseetBridge(AI_NAME);

console.log(`[RAQEEB-WATCHER] Active and monitoring live errors for ${TOOL_NAME}...`);

if (!fs.existsSync(COLLECTED_DIR)) {
  fs.mkdirSync(COLLECTED_DIR, { recursive: true });
}

if (!fs.existsSync(LIVE_ERRORS_FILE)) {
  fs.writeFileSync(LIVE_ERRORS_FILE, '', 'utf8');
}

let lastSize = fs.statSync(LIVE_ERRORS_FILE).size;

fs.watchFile(LIVE_ERRORS_FILE, { interval: 1000 }, (curr) => {
  if (curr.size > lastSize) {
    const stream = fs.createReadStream(LIVE_ERRORS_FILE, { start: lastSize, end: curr.size });
    stream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      lines.forEach((line) => {
        try {
          const errorObj = JSON.parse(line);
          console.error(`\n[RAQEEB-ALERT] Live error captured:`, errorObj.message || errorObj);
          // Sync with Waseet
          waseet.init();
          const incidentId = 'incident_' + Date.now();
          const incidentReport = path.join(PROJECT_ROOT, 'results-repo', 'latest', 'live-incident.json');
          fs.writeFileSync(incidentReport, JSON.stringify({ incidentId, error: errorObj, timestamp: new Date().toISOString() }, null, 2));
        } catch (e) {}
      });
    });
    lastSize = curr.size;
  }
});
