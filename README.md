# cypress-healing

[![Release & Publish](https://github.com/codetestfactory-sohail/cypress-healing/actions/workflows/release.yml/badge.svg)](https://github.com/codetestfactory-sohail/cypress-healing/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/cypress-healing.svg)](https://www.npmjs.com/package/cypress-healing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Mochawesome Reporter](https://img.shields.io/badge/Reporter-Mochawesome-1f4f8b.svg)](https://www.npmjs.com/package/cypress-mochawesome-reporter)
[![Allure Plugin](https://img.shields.io/badge/Reporter-Allure-EF4056.svg)](https://www.npmjs.com/package/@shelex/cypress-allure-plugin)
[![Cypress Cloud](https://img.shields.io/badge/Cypress%20Cloud-Recorded-00bcd4)](https://docs.cypress.io/guides/cloud/introduction)

Self‑healing Cypress locators and intent‑aware smart waits with structured logging that surfaces in Mochawesome, Allure, and the Cypress Cloud Dashboard (when enabled), plus a dedicated HTML report and a machine‑readable JSON map of healed selectors.

---

## Table of Contents
- Features
- Requirements
- Installation
- Quick Start
  - Configure the plugin
  - Register commands
- Usage
  - cy.waitFor (self-healing)
  - cy.getLoc (self‑healing)
- Reporting
- Configuration (advanced)
- TypeScript
- CI/CD
- Contributing
- Security
- License

---

## Features
- Self-healing robust waits with `cy.waitFor()` for selectors, aliases, or fixed delays along with logging.
- Self‑healing `cy.getLoc()` that attempts alternative selectors when a locator breaks.
- JSON record of healed selectors and an HTML healing report.
- Minimal setup: one plugin and one support import.

## Requirements
- Cypress installed in your project.
- Node.js and npm/yarn (any modern LTS is fine).

## Installation

```bash
npm install --save-dev cypress-healing
# or
yarn add --dev cypress-healing
```

## Quick Start

### 1) Configure the plugin (cypress.config.js)
Register the plugin so healing data can be loaded before a run and the HTML report can be generated after the run.

```js path=null start=null
const { defineConfig } = require('cypress');
const healingPlugin = require('cypress-healing/plugin');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register the healing plugin hooks
      healingPlugin(on, config);

      // Optional: set runtime configuration for healing
      // These values are read via Cypress.env('healingConfig') at test time
      config.env = config.env || {};
      config.env.healingConfig = {
        // Where to save healed selectors (JSON)
        healFile: 'cypress/healed-selectors.json',
        // Where to generate the HTML report
        reportFile: 'cypress/healing-report.html'
        // strategies: [fn(selector) => newSelector, ...] // Advanced; see Configuration
      };

      return config;
    },
  },
});
```

### 2) Register commands (cypress/support/e2e.js)

```js path=null start=null
// or cypress/support/e2e.ts
import 'cypress-healing/commands';
```

---

## Usage

### cy.waitFor(target, options?)
Smart waits for selectors, route aliases, or a fixed delay.

```js path=null start=null
// Wait for a selector to appear (auto-detects action)
cy.waitFor('#spinner');

// Explicitly wait for a selector to disappear
cy.waitFor('#spinner', { action: 'disappear', timeout: 15000 });

// Wait for a selector to appear with a custom log message
cy.waitFor('.toast-message', { action: 'appear', message: 'Waiting for toast' });

// Wait for a network alias
cy.waitFor('@getUser');

// Wait for a fixed number of milliseconds
cy.waitFor(500);
```

Options:
- timeout: number (default 10000)
- message: string (for logging)
- action: 'appear' | 'disappear' (auto‑detected if omitted)

### cy.getLoc(selector, options?)
A drop‑in replacement for `cy.get()` that will try to heal broken selectors using simple strategies and record the result.

```js path=null start=null
// Use like cy.get(), but with self‑healing
cy.getLoc('button.submit').click();
```

What happens when a locator breaks:
- The library attempts alternative strategies (e.g., data‑attributes, class partial matches, aria‑labels)
- If a working alternative is found, it is:
  - Logged in the Cypress runner
  - Stored in JSON (default: cypress/healed-selectors.json)
  - Included in an HTML report after the run

---

## Reporting
- Healed selectors JSON: cypress/healed-selectors.json
- Healing report HTML: cypress/healing-report.html

### Reporter compatibility
No special integration is required for popular reporters—the library uses standard `cy.log()` messages during waits and healing, and writes to stdout when generating the HTML report. When you enable a reporter, these messages show up in the reporter output:

- Mochawesome: Enable a Mochawesome-based reporter (for example, `cypress-mochawesome-reporter`). Your healing and wait logs appear in the test output. Example setup:

```js path=null start=null
// cypress.config.js
const { defineConfig } = require('cypress');
const healingPlugin = require('cypress-healing/plugin');
const mochawesome = require('cypress-mochawesome-reporter/plugin');

module.exports = defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports/mochawesome',
    charts: true,
    reportPageTitle: 'Cypress Healing',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  e2e: {
    setupNodeEvents(on, config) {
      mochawesome(on);
      healingPlugin(on, config);
      return config;
    },
  },
});
```

```js path=null start=null
// cypress/support/e2e.js (or e2e.ts)
import 'cypress-mochawesome-reporter/register';
import 'cypress-healing/commands';
```

- Allure: Use `@shelex/cypress-allure-plugin`. Healing logs (from `cy.log`) appear in the test timeline. Example setup:

```js path=null start=null
// cypress.config.js
const { defineConfig } = require('cypress');
const healingPlugin = require('cypress-healing/plugin');
const allureWriter = require('@shelex/cypress-allure-plugin/writer');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      allureWriter(on, config);
      healingPlugin(on, config);
      return config;
    },
    env: { allure: true },
  },
});
```

```js path=null start=null
// cypress/support/e2e.js (or e2e.ts)
import '@shelex/cypress-allure-plugin';
import 'cypress-healing/commands';
```

Allure report generation (optional):

```bash path=null start=null
# Install the Allure CLI locally
npm i -D allure-commandline

# Generate the HTML report from results (default folder: allure-results)
npx allure generate --clean allure-results -o allure-report

# Open the generated report locally
npx allure open allure-report
```

- Cypress Cloud Dashboard: Logs are visible in recorded test output. Run with recording enabled and keep secrets out of your config:

```bash path=null start=null
# Set your record key from a secure source
$env:CYPRESS_RECORD_KEY = '<your-record-key>'
# Run and record the results to the Cloud Dashboard
npx cypress run --record --key $env:CYPRESS_RECORD_KEY
```

### Troubleshooting reporters
- Mochawesome: Ensure the reporter is configured (`reporter: 'cypress-mochawesome-reporter'`), the plugin is registered in `setupNodeEvents`, and `cypress-mochawesome-reporter/register` is imported in your support file. Missing the support import can lead to incomplete HTML output.
- Allure: Ensure the writer is registered in `setupNodeEvents`, `env: { allure: true }` is set, and `@shelex/cypress-allure-plugin` is imported in support. Clear old `allure-results` if reports look stale.
- Cypress Cloud: Use `--record` with a valid Record Key stored in an environment variable (do not hard‑code). Make sure your project ID is configured.
- Healing HTML/JSON not generated: Confirm `healingPlugin(on, config)` is called in `setupNodeEvents`. The files are written after the run completes.

Example JSON entry:

```json path=null start=null
{
  "#submit": "[data-test='submit']",
  ".btn.primary": "[class*='btn'][class*='primary']"
}
```

---

## Configuration (advanced)
At runtime, configuration is read from `Cypress.env('healingConfig')`.

Supported options:
- healFile: string – path to the healed selectors JSON file
- reportFile: string – path to the generated HTML report
- strategies: function[] – custom healing functions of the form `(selector) => newSelector | selector`

Example:

```js path=null start=null
// cypress.config.js
config.env.healingConfig = {
  healFile: 'cypress/custom/healed.json',
  reportFile: 'cypress/custom/report.html',
  strategies: [
    // Prefer data-test over id
    (sel) => sel.startsWith('#') ? `[data-test='${sel.slice(1)}']` : sel,
    // Loosen strict class selectors
    (sel) => sel.includes('.')
      ? sel
          .split('.')
          .filter(Boolean)
          .map((part, i) => i === 0 && !part.startsWith('[') ? part : `[class*='${part}']`)
          .join('')
      : sel,
  ],
};
```

---

## TypeScript
Types for the custom commands are included. After importing `cypress-healing/commands`, you can use the commands with type support.

```ts path=null start=null
// cypress/support/e2e.ts
import 'cypress-healing/commands';

// Example usage with IntelliSense
yourTest(() => {
  cy.getLoc('#submit').click();
  cy.waitFor('@getUser', { timeout: 15000 });
});
```

If your editor does not pick up the types automatically, add `cypress-healing` to `compilerOptions.types` in your tsconfig used by Cypress:

```json path=null start=null
{
  "compilerOptions": {
    "types": ["cypress", "cypress-healing"]
  }
}
```

---
## License
MIT © 2025 **Sohail Mohammed** | [sohailcode.com](https://sohailcode.com) | [CodeTestFactory](https://sohailcode.com)
