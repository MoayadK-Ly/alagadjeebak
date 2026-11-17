/**
 * Waseet Bridge (وسيط - جسر التواصل بين رقيب والذكاء الاصطناعي)
 * Tool: Alagadjeebak Raqeeb (على قد جيبك رقيب)
 * Target AI: Antigravity
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const RESULTS_DIR = path.join(PROJECT_ROOT, 'results-repo');
const LATEST_DIR = path.join(RESULTS_DIR, 'latest');

class WaseetBridge {
  constructor(aiName = 'Antigravity') {
    this.aiName = aiName;
  }

  init() {
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    if (!fs.existsSync(LATEST_DIR)) {
      fs.mkdirSync(LATEST_DIR, { recursive: true });
    }
  }

  async syncToWaseet(runId) {
    this.init();
    // Check if results-repo is a git repository
    const gitDir = path.join(RESULTS_DIR, '.git');
    if (fs.existsSync(gitDir)) {
      try {
        execSync('git add -A && git commit -m "raqeeb: sync run ' + runId + '" && git push origin main', {
          cwd: RESULTS_DIR,
          stdio: 'pipe'
        });
        return { synced: true, remote: true };
      } catch (e) {
        return { synced: true, remote: false, warning: e.message };
      }
    }
    return { synced: true, remote: false, note: 'Local Waseet repository active' };
  }

  checkAnswer(runId) {
    const answerFile = path.join(LATEST_DIR, 'answer.md');
    if (!fs.existsSync(answerFile)) {
      return null;
    }
    try {
      const content = fs.readFileSync(answerFile, 'utf8');
      if (content.includes(`run: ${runId}`) || content.includes(runId)) {
        return content;
      }
    } catch (e) {}
    return null;
  }

  writeMockOrAutoAnswer(runId, answerText) {
    this.init();
    const answerFile = path.join(LATEST_DIR, 'answer.md');
    const fullText = `run: ${runId}\nai: ${this.aiName}\ntimestamp: ${new Date().toISOString()}\n\n${answerText}`;
    fs.writeFileSync(answerFile, fullText, 'utf8');
    return answerFile;
  }
}

module.exports = WaseetBridge;
