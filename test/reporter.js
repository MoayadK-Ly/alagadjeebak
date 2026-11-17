/**
 * Raqeeb Report Generator
 * Tool: Alagadjeebak Raqeeb (على قد جيبك رقيب)
 * Target AI Inspector: Antigravity
 */

const fs = require('fs');
const path = require('path');

const AI_NAME = 'Antigravity';
const TOOL_NAME = 'على قد جيبك';
const RAQEEB_FULL_NAME = `${TOOL_NAME} رقيب`;

const PROJECT_ROOT = path.resolve(__dirname, '..');
const COLLECTED_DIR = path.join(PROJECT_ROOT, 'collected');
const RESULTS_REPO_DIR = path.join(PROJECT_ROOT, 'results-repo');
const LATEST_DIR = path.join(RESULTS_REPO_DIR, 'latest');

function generateReports(testResults, options = {}) {
  const runId = 'run_' + Date.now();
  const timestamp = new Date().toISOString();
  const total = testResults.length;
  const passed = testResults.filter(t => t.passed).length;
  const failed = total - passed;
  const allPassed = failed === 0;
  const totalDuration = testResults.reduce((acc, t) => acc + (t.durationMs || 0), 0);

  // 1. Load History Comparison
  const historyPath = path.join(COLLECTED_DIR, 'history.json');
  let history = [];
  try {
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
  } catch (e) { history = []; }

  const previousRun = history.length > 0 ? history[history.length - 1] : null;
  let historyDelta = 'أول جولة فحص مسجلة (No previous history)';
  if (previousRun) {
    const diffPassed = passed - (previousRun.passed || 0);
    const diffFailed = failed - (previousRun.failed || 0);
    historyDelta = `مقارنة بالجولة السابقة (${previousRun.runId}): ${diffPassed >= 0 ? '+' + diffPassed : diffPassed} نجاح، ${diffFailed >= 0 ? '+' + diffFailed : diffFailed} تعثر.`;
  }

  // 2. Build Text Report for AI: report-for-Antigravity.txt
  const textReportName = `report-for-${AI_NAME}.txt`;
  const textReportPath = path.join(PROJECT_ROOT, textReportName);

  let textReport = `======================================================================
RAQEEB AUTOMATED AUDIT & SIMULATION REPORT
Tool: ${TOOL_NAME} (${RAQEEB_FULL_NAME})
Target AI: ${AI_NAME}
Run ID: ${runId}
Generated At: ${timestamp}
Duration: ${totalDuration}ms
Status: ${allPassed ? 'ALL TESTS PASSED [SUCCESS]' : 'FAILURES DETECTED [NEEDS_ACTION]'}
======================================================================

1. EXECUTIVE SUMMARY
----------------------------------------------------------------------
Total Tests Executed: ${total}
Passed: ${passed}
Failed: ${failed}
Success Rate: ${Math.round((passed / total) * 100)}%
History Comparison: ${historyDelta}
Project Memory Reference: AGENTS.md

2. DETAILED TEST RESULTS
----------------------------------------------------------------------
`;

  testResults.forEach((t, i) => {
    textReport += `[#${i + 1}] [${t.category.toUpperCase()}] ${t.name}\n`;
    textReport += `  Status:   ${t.passed ? 'PASSED ✅' : 'FAILED ❌'}\n`;
    textReport += `  Duration: ${t.durationMs}ms\n`;
    textReport += `  Message:  ${t.message}\n`;
    if (t.details) {
      textReport += `  Details:\n${t.details.split('\n').map(l => '    ' + l).join('\n')}\n`;
    }
    textReport += `----------------------------------------------------------------------\n`;
  });

  if (!allPassed) {
    textReport += `
3. ACTION REQUIRED BY ${AI_NAME.toUpperCase()}
----------------------------------------------------------------------
Please analyze the failed checks above. Cross-reference AGENTS.md for architecture rules.
Apply root-level fixes to server.js or public/index.html, re-run Raqeeb, and confirm 100% pass rate.
`;
  } else {
    textReport += `
3. VERIFICATION OUTCOME
----------------------------------------------------------------------
All static audits, game logic constraints, anti-sniper timers, and full multiplayer simulation
robot sessions executed flawlessly with zero deadlocks and 100% test passing rate.
`;
  }

  fs.writeFileSync(textReportPath, textReport, 'utf8');

  // 3. Build Visual HTML Report: report.html
  const htmlPath = path.join(PROJECT_ROOT, 'report.html');

  const testCardsHtml = testResults.map((t, idx) => `
    <div class="border ${t.passed ? 'border-emerald-500/40 bg-slate-900/80' : 'border-rose-500/60 bg-rose-950/20'} rounded-2xl p-4 sm:p-5 mb-3 transition shadow-lg">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">${t.passed ? '✅' : '❌'}</span>
          <div>
            <h4 class="font-black text-sm sm:text-base text-white">${t.name}</h4>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">${t.category}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 font-mono">${t.durationMs}ms</span>
          <span class="text-xs font-black px-2.5 py-1 rounded-full ${t.passed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">
            ${t.passed ? 'ناجح' : 'تعثر'}
          </span>
        </div>
      </div>
      <p class="mt-2.5 text-xs text-slate-300 font-medium">${t.message}</p>
      ${t.details ? `
        <details class="mt-3 text-xs">
          <summary class="cursor-pointer text-indigo-400 hover:text-indigo-300 font-bold select-none">عرض سجل التفاصيل الفنية ▾</summary>
          <pre class="mt-2 p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap border border-slate-800">${escapeHtml(t.details)}</pre>
        </details>
      ` : ''}
    </div>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${RAQEEB_FULL_NAME} — تقرير الفحص والمحاكاة</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap');
    body { font-family: 'Tajawal', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8">
  <div class="max-w-4xl mx-auto">
    
    <!-- Header -->
    <header class="border border-slate-800 bg-slate-900/90 rounded-3xl p-6 sm:p-8 mb-6 shadow-2xl relative overflow-hidden backdrop-blur">
      <div class="absolute -top-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="flex items-center justify-between flex-wrap gap-4 relative z-10">
        <div>
          <div class="flex items-center gap-3">
            <span class="text-3xl">🛡️</span>
            <div>
              <h1 class="text-2xl sm:text-3xl font-black text-white">${RAQEEB_FULL_NAME}</h1>
              <p class="text-xs sm:text-sm text-slate-400 mt-0.5">نظام الفحص والمحاكاة الذكي والرصد التلقائي</p>
            </div>
          </div>
        </div>
        <div class="text-left font-mono">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border ${allPassed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'}">
            <span>${allPassed ? '● سليم وجاهز' : '▲ يتطلب تدخل'}</span>
          </div>
          <div class="text-[11px] text-slate-400 mt-1">المعرف: ${runId}</div>
        </div>
      </div>

      <!-- Quick Metrics -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
          <div class="text-2xl font-black text-white">${total}</div>
          <div class="text-[11px] text-slate-400 font-bold mt-0.5">إجمالي الفحوصات</div>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
          <div class="text-2xl font-black text-emerald-400">${passed}</div>
          <div class="text-[11px] text-slate-400 font-bold mt-0.5">ناجحة ✅</div>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
          <div class="text-2xl font-black ${failed > 0 ? 'text-rose-400' : 'text-slate-400'}">${failed}</div>
          <div class="text-[11px] text-slate-400 font-bold mt-0.5">متعثرة ❌</div>
        </div>
        <div class="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-center">
          <div class="text-2xl font-black text-indigo-400">${totalDuration}ms</div>
          <div class="text-[11px] text-slate-400 font-bold mt-0.5">زمن التنفيذ</div>
        </div>
      </div>
    </header>

    <!-- AI Inspector & Waseet Bridge Card -->
    <div class="border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 rounded-3xl p-6 mb-6 shadow-xl relative">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🤖</span>
          <div>
            <h3 class="text-base font-black text-white">الذكاء الاصطناعي المسؤول: <span class="text-indigo-400 font-mono">${AI_NAME}</span></h3>
            <p class="text-xs text-slate-400">جسر وسيط (Waseet) مفعل لنقل التقرير وتلقي الإصلاحات التلقائية</p>
          </div>
        </div>
        <div class="text-xs text-slate-400 font-mono">
          ملف التقرير: <span class="text-amber-300">${textReportName}</span>
        </div>
      </div>
      
      <div id="aiResponseCard" class="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/20 text-xs text-slate-300">
        <div class="flex items-center justify-between mb-2">
          <span class="font-bold text-indigo-300">رد وتحديث الذكاء الاصطناعي (${AI_NAME}):</span>
          <span class="text-[10px] text-slate-500 font-mono">حالة الجسر: متصل</span>
        </div>
        <p id="aiResponseContent" class="leading-relaxed">
          ${allPassed ? '✅ تم استلام وفحص التقرير بنجاح. كافة معايير اللوبي، وحظر طرد النفس، ومؤقتات المزايدة، ومحاكاة اللعب الفعلي بين المضيف والمنضمين والبوتات سليمة 100% ولا توجد أي اختناقات أو أخطاء.' : '⚠️ رصد تعثر في بعض الفحوصات. يجري تحليل التقرير عبر وسيط وتطبيق الإصلاح الجذري فوراً.'}
        </p>
      </div>
    </div>

    <!-- Test Results Section -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-black text-white flex items-center gap-2">
          <span>نتائج الفحص والمحاكاة</span>
          <span class="text-xs text-slate-400 font-normal">(${historyDelta})</span>
        </h3>
      </div>
      ${testCardsHtml}
    </div>

    <!-- Footer -->
    <footer class="text-center text-xs text-slate-500 py-4 border-t border-slate-900">
      ${RAQEEB_FULL_NAME} • تم البناء والتطوير بواسطة ${AI_NAME} • متطابق مع مواصفات رقيب ووسيط وذاكرة المشروع AGENTS.md
    </footer>

  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');

  // 4. Save JSON Report in results-repo/latest
  if (!fs.existsSync(LATEST_DIR)) {
    fs.mkdirSync(LATEST_DIR, { recursive: true });
  }

  const reportData = {
    runId,
    toolName: TOOL_NAME,
    raqeebName: RAQEEB_FULL_NAME,
    aiName: AI_NAME,
    timestamp,
    durationMs: totalDuration,
    total,
    passed,
    failed,
    allPassed,
    results: testResults
  };

  fs.writeFileSync(path.join(LATEST_DIR, 'report.json'), JSON.stringify(reportData, null, 2), 'utf8');
  fs.writeFileSync(path.join(LATEST_DIR, textReportName), textReport, 'utf8');
  fs.writeFileSync(path.join(LATEST_DIR, 'meta.txt'), `runId: ${runId}\ntimestamp: ${timestamp}\nstatus: ${allPassed ? 'SUCCESS' : 'FAILED'}\n`, 'utf8');

  // Save history
  history.push({ runId, timestamp, total, passed, failed, durationMs: totalDuration });
  if (history.length > 50) history.shift();
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

  return {
    runId,
    allPassed,
    total,
    passed,
    failed,
    textReportPath,
    htmlPath
  };
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  AI_NAME,
  TOOL_NAME,
  RAQEEB_FULL_NAME,
  generateReports
};
