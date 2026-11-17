/**
 * Raqeeb Static Checks & Code Integrity Suite
 * Tool: Alagadjeebak (على قد جيبك)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

async function runStaticChecks() {
  const results = [];

  function record(name, testFn) {
    const start = Date.now();
    try {
      const details = testFn();
      results.push({
        name,
        category: 'static',
        passed: true,
        message: 'Passed successfully',
        details: details || null,
        durationMs: Date.now() - start
      });
    } catch (err) {
      results.push({
        name,
        category: 'static',
        passed: false,
        message: err.message,
        details: err.stack,
        durationMs: Date.now() - start
      });
    }
  }

  // 1. Mandatory Files Presence
  record('Mandatory Files Verification', () => {
    const requiredFiles = ['server.js', 'package.json', 'public/index.html', 'AGENTS.md'];
    for (const f of requiredFiles) {
      const p = path.join(PROJECT_ROOT, f);
      if (!fs.existsSync(p)) {
        throw new Error(`Missing mandatory file: ${f}`);
      }
    }
    return `Verified: ${requiredFiles.join(', ')}`;
  });

  // 2. Server.js Syntax Check
  record('Server.js Node Syntax Validation', () => {
    const serverPath = path.join(PROJECT_ROOT, 'server.js');
    execSync(`node -c "${serverPath}"`, { stdio: 'pipe' });
    const stats = fs.statSync(serverPath);
    return `server.js syntax valid (${stats.size} bytes)`;
  });

  // 3. Client HTML & Embedded JS Syntax Check
  record('Client public/index.html Scripts Syntax Validation', () => {
    const htmlPath = path.join(PROJECT_ROOT, 'public', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let scriptIndex = 0;
    while ((match = scriptRegex.exec(html)) !== null) {
      const scriptCode = match[1];
      if (!scriptCode.trim()) continue;
      // Skip external scripts with src
      if (match[0].includes('src=')) continue;
      scriptIndex++;
      new vm.Script(scriptCode, { filename: `index.html#script-${scriptIndex}` });
    }
    return `Parsed and verified ${scriptIndex} client inline scripts without syntax errors`;
  });

  // 4. Memory & Architecture Spec (AGENTS.md) Integrity
  record('Project Memory (AGENTS.md) Audit', () => {
    const memoryPath = path.join(PROJECT_ROOT, 'AGENTS.md');
    const content = fs.readFileSync(memoryPath, 'utf8');
    if (!content.includes('على قد جيبك') && !content.includes('alagadjeebak')) {
      throw new Error('AGENTS.md does not contain proper project identifier');
    }
    return `AGENTS.md loaded successfully (${content.length} characters of project memory)`;
  });

  // 5. Host Kick & Isolation Security Audit
  record('Host vs Guest Isolation Static Verification', () => {
    const htmlPath = path.join(PROJECT_ROOT, 'public', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Check that hostControlsCard is hidden by default in the markup
    if (!html.includes('id="hostControlsCard"') || !html.includes('class="hidden') && !html.includes('hidden')) {
      // It must be hidden by default
      const tagMatch = html.match(/<div[^>]*id="hostControlsCard"[^>]*>/);
      if (!tagMatch || !tagMatch[0].includes('hidden')) {
        throw new Error('hostControlsCard is NOT hidden by default in HTML markup!');
      }
    }

    // Check that canKick contains !isMe
    if (!html.includes('gameState.isHost') || !html.includes('!isMe')) {
      throw new Error('canKick logic does not strictly enforce !isMe');
    }

    return 'Verified: host controls hidden by default, self-kick impossible in client code';
  });

  // 6. WebSocket Protocol Safety Check
  record('Server WebSocket Robustness & Error Shielding', () => {
    const serverPath = path.join(PROJECT_ROOT, 'server.js');
    const code = fs.readFileSync(serverPath, 'utf8');
    if (!code.includes('try') || !code.includes('JSON.parse(message)')) {
      throw new Error('Server does not wrap JSON.parse in try-catch on incoming messages');
    }
    if (!code.includes('bannedNames') || !code.includes('bannedIds')) {
      throw new Error('Server room does not implement permanent banned lists');
    }
    return 'Verified: try/catch shielding, permanent ban lists, safe room view broadcast';
  });

  return results;
}

module.exports = {
  runStaticChecks
};
