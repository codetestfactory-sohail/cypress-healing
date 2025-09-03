const fs = require('fs');
const path = require('path');

const defaultStrategies = [
  (sel) => sel.replace('#', '[data-test='),          // id → data-test
  (sel) => sel.replace('.', '[class*='),             // class → fuzzy
  (sel) => sel.replace(/(\w+)/, "[aria-label='$1']") // aria-label fallback
];

function getConfig() {
  const cfg = (globalThis.Cypress && Cypress.env('healingConfig')) || {};
  return {
    healFile: cfg.healFile || path.resolve('cypress/healed-selectors.json'),
    reportFile: cfg.reportFile || path.resolve('cypress/healing-report.html'),
    strategies: cfg.strategies || defaultStrategies
  };
}

let healedSelectors = {};

function loadSelectors() {
  const { healFile } = getConfig();
  if (fs.existsSync(healFile)) {
    healedSelectors = JSON.parse(fs.readFileSync(healFile, 'utf-8'));
  }
}

function saveSelectors() {
  const { healFile } = getConfig();
  fs.mkdirSync(path.dirname(healFile), { recursive: true });
  fs.writeFileSync(healFile, JSON.stringify(healedSelectors, null, 2));
}

function recordHealing(original, healed) {
  healedSelectors[original] = healed;
  saveSelectors();
}

function getHealedSelector(original) {
  return healedSelectors[original] || null;
}

function tryHealing(original) {
  const { strategies } = getConfig();
  for (const fn of strategies) {
    const healed = fn(original);
    if (healed && healed !== original) {
      recordHealing(original, healed);
      return healed;
    }
  }
  return null;
}

function finalizeHealingReport() {
  const { reportFile } = getConfig();
  const entries = Object.entries(healedSelectors);
  if (!entries.length) return;

  const html = `
    <html><head><title>Cypress Healing Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #333; color: #fff; }
        tr:nth-child(even) { background: #f9f9f9; }
      </style>
    </head><body>
      <h1>🩹 Cypress Healing Report</h1>
      <table>
        <tr><th>Original Selector</th><th>Healed Selector</th></tr>
        ${entries.map(([o, h]) => `<tr><td>${o}</td><td>${h}</td></tr>`).join('')}
      </table>
    </body></html>`;
  fs.mkdirSync(require('path').dirname(reportFile), { recursive: true });
  fs.writeFileSync(reportFile, html);
  console.log(`📄 Healing report generated at: ${reportFile}`);
}

module.exports = { loadSelectors, recordHealing, getHealedSelector, tryHealing, finalizeHealingReport };