# cypress-healing

[![Release & Publish](https://github.com/codetestfactory-sohail/cypress-healing/actions/workflows/release.yml/badge.svg)](https://github.com/codetestfactory-sohail/cypress-healing/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/cypress-healing.svg)](https://www.npmjs.com/package/cypress-healing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Mochawesome Reporter](https://img.shields.io/badge/Reporter-Mochawesome-1f4f8b.svg)](https://www.npmjs.com/package/cypress-mochawesome-reporter)
[![Allure Plugin](https://img.shields.io/badge/Reporter-Allure-EF4056.svg)](https://www.npmjs.com/package/@shelex/cypress-allure-plugin)
[![Cypress Cloud](https://img.shields.io/badge/Cypress%20Cloud-Recorded-00bcd4)](https://docs.cypress.io/guides/cloud/introduction)

🩹 **AI-powered self-healing locators** and **smart waits** for Cypress with **heuristic and AI-based selector healing**. Features intelligent fallback strategies, multiple AI provider support (OpenAI, Gemini, Copilot), and comprehensive healing reports.

---

## Table of Contents
- [What's New in v0.2.0](#whats-new-in-v020)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [cy.smartWait](#cysmartwaittarget-options) (replaces waitFor)
  - [cy.smartGet](#cysmartget-selector-options) (Smart healing + AI)
  - [cy.getLoc](#cygetlocselector-fallbackselectors) (Auto healing without AI)
- [Healing Strategies](#healing-strategies)
- [AI Configuration](#ai-configuration)
- [Reporting](#reporting)
- [Migration Guide](#migration-guide)
- [TypeScript](#typescript)
- [License](#license)

---

## What's New in v0.2.0

### 🎆 Major Updates
- **⚠️ BREAKING**: Renamed `cy.waitFor()` to `cy.smartWait()` to avoid conflicts with Cypress 14+
- **🤖 NEW**: AI-powered healing with support for OpenAI, Google Gemini, Cursor, Warp, and GitHub Copilot
- **🎯 NEW**: `cy.smartGet()` command with intelligent heuristic auto-healing
- **📦 NEW**: Full TypeScript support with proper type definitions
- **⚙️ NEW**: Configurable healing strategies and priorities
- **📊 IMPROVED**: Enhanced HTML reports with healing statistics

## Features

- **🤖 AI-Powered Healing**: Integrate with OpenAI, Google Gemini, Cursor, Warp, and GitHub Copilot for intelligent selector healing
- **🎯 Heuristic Auto-Healing**: Smart fallback strategies using data attributes, ARIA labels, roles, text content, and more
- **⏳ Smart Wait Command**: `cy.smartWait()` replaces `waitFor` to avoid conflicts with Cypress 14+
- **🔄 Multiple Healing Strategies**: Combines heuristic, AI, and manual healing approaches
- **📊 Detailed Reports**: Generate HTML reports showing all healed selectors and their methods
- **⚙️ Highly Configurable**: Customize healing priorities, AI providers, and heuristic patterns
- **📝 TypeScript Support**: Full TypeScript support with type definitions
- **🚀 Zero-Config Option**: Works out of the box with sensible defaults

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
Register the plugin for enhanced healing capabilities and reporting.

```javascript
const { defineConfig } = require('cypress');
const { registerHealingPlugin } = require('cypress-healing');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Register the healing plugin with enhanced features
      return registerHealingPlugin(on, config);
    },
  },
});
```

### 2) Register commands (cypress/support/e2e.js)

```javascript
// cypress/support/e2e.js or e2e.ts
import 'cypress-healing';
```

### 3) Configure healing strategies (optional)

Create `src/config/healing.config.json` for advanced configuration:

```json
{
  "ai": {
    "enabled": true,
    "provider": "copilot",
    "providers": {
      "openai": { "apiKey": "", "model": "gpt-4" },
      "gemini": { "apiKey": "", "model": "gemini-pro" }
    }
  },
  "heuristics": {
    "priority": ["data-cy", "data-testid", "aria-label", "role", "text"],
    "excludePatterns": ["^ember-", "^react-", "^[0-9]+$"]
  }
}
```

---

## Commands

### cy.smartWait(target, options?)
**🆕 Replaces `cy.waitFor()` to avoid Cypress 14+ conflicts**

Smart waits for selectors, route aliases, or a fixed delay.

```javascript
// Wait for element to appear
cy.smartWait('#loading-spinner');

// Wait for element to disappear
cy.smartWait('.modal', { action: 'disappear', timeout: 5000 });

// Wait for API response
cy.intercept('GET', '/api/data').as('getData');
cy.smartWait('@getData');

// Simple delay
cy.smartWait(1000);
```

**Options:**
- `timeout`: number (default 10000)
- `message`: string (custom log message)
- `action`: 'appear' | 'disappear' (auto-detected if omitted)

### cy.smartGet(selector, options?)
**🆕 NEW - Smart selector with intelligent auto-healing and AI support**

Automatically heals broken selectors using heuristics and AI.

```javascript
// Basic usage - will auto-heal if selector breaks
cy.smartGet('.submit-button').click();

// With custom healing options
cy.smartGet('#dynamic-id', {
  priority: ['data-cy', 'aria-label', 'text'],
  excludePatterns: ['^[0-9]+$'],
  logging: true
}).type('Hello World');

// Heals form elements
cy.smartGet('input[name=email]').type('user@example.com');
cy.smartGet('button[type=submit]').click();
```

**Healing Priority (default order):**
1. `data-cy` attributes
2. `data-testid` attributes  
3. `aria-label` attributes
4. `role` attributes
5. Text content
6. Label associations
7. Stable class names
8. Non-dynamic IDs

**Options:**
- `priority`: string[] (customize heuristic order)
- `excludePatterns`: string[] (regex patterns to exclude)
- `logging`: boolean (enable/disable logs)
- `maxTextLength`: number (max text length for text-based healing)
- `minTextLength`: number (min text length for text-based healing)

### cy.getLoc(selector, fallbackSelectors?)
**Legacy command with manual fallback selectors**

```javascript
// Provide manual fallback selectors
cy.getLoc('.primary', ['.secondary', '#fallback']).click();
```

---

## Healing Strategies

### 1. Heuristic Healing (Default)
The package uses smart heuristics to find elements when selectors fail:

```javascript
// Example: If '.submit-btn' fails, it tries:
// 1. [data-cy="submit"] or [data-testid="submit"]
// 2. [aria-label="Submit"]
// 3. [role="button"]:contains("Submit")
// 4. button:contains("Submit")
// 5. .submit, .btn-submit (stable classes)
// 6. #submit (if ID is stable)
```

### 2. AI Healing (Optional)
When configured with API keys, the package can use AI providers:

- **OpenAI GPT-4**: Advanced selector generation
- **Google Gemini**: Fast and efficient healing
- **GitHub Copilot**: IDE-integrated suggestions (default)
- **Cursor**: Context-aware healing
- **Warp**: Terminal-integrated healing

### 3. Manual Healing
Provide manual selector mappings in `cypress/manual-healing.json`:

```json
{
  ".old-button": "[data-cy='new-button']",
  "#legacy-id": "[aria-label='Submit form']"
}
```

---

## AI Configuration

To enable AI-powered healing, configure your providers in `src/config/healing.config.json`:

```json
{
  "ai": {
    "enabled": true,
    "provider": "openai",
    "providers": {
      "openai": {
        "apiKey": "YOUR_OPENAI_API_KEY",
        "model": "gpt-4",
        "temperature": 0.2
      },
      "gemini": {
        "apiKey": "YOUR_GEMINI_API_KEY",
        "model": "gemini-pro"
      },
      "copilot": {
        "endpoint": "YOUR_COPILOT_ENDPOINT",
        "apiKey": "YOUR_COPILOT_KEY"
      }
    }
  },
  "heuristics": {
    "priority": ["data-cy", "data-testid", "aria-label", "role", "text", "label", "class", "id"],
    "excludePatterns": ["^ember-", "^react-", "^ng-", "^[0-9]+$"],
    "enableLogging": true,
    "maxTextLength": 50,
    "minTextLength": 1
  },
  "healing": {
    "maxAttempts": 3,
    "timeout": 2000,
    "saveHealed": true,
    "healedSelectorsFile": "cypress/healed-selectors.json",
    "reportFile": "cypress/healing-report.html",
    "autoHeal": true
  }
}
```

**Note:** AI features require valid API keys. The heuristic healing works without any API configuration.

---

## Reporting

### Enhanced HTML Report
After test runs, an HTML report is generated showing:
- Total number of healed selectors
- Breakdown by healing method (heuristic, AI, manual)
- Original vs healed selectors
- Timestamps and statistics

**Default locations:**
- JSON data: `cypress/healed-selectors.json`
- HTML report: `cypress/healing-report.html`

### Programmatic Access
Access healing data in your tests:

```javascript
// Generate report on demand
cy.task('generateHealingReport');

// Get all healed selectors
cy.task('getHealedSelectors').then((selectors) => {
  console.log('Healed:', selectors);
});

// Clear healing history
cy.task('clearHealedSelectors');
```

---

## Migration Guide

### Migrating from v0.1.x to v0.2.0

#### 1. Update `waitFor` to `smartWait`
```javascript
// Old (may conflict with Cypress 14+)
cy.waitFor('.element');
cy.waitFor('@api');
cy.waitFor(1000);

// New (no conflicts)
cy.smartWait('.element');
cy.smartWait('@api');
cy.smartWait(1000);
```

#### 2. Use new auto-healing
```javascript
// Old manual approach
cy.getLoc('.primary', ['.fallback1', '.fallback2']);

// New auto-healing approach
cy.smartGet('.primary'); // Automatically finds best selector
```

#### 3. Update plugin registration
```javascript
// Old
const healingPlugin = require('cypress-healing/plugin');

// New
const { registerHealingPlugin } = require('cypress-healing');
```

---

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

## TypeScript

Full TypeScript support with type definitions included:

```typescript
// cypress/support/e2e.ts
import 'cypress-healing';

// Use with full IntelliSense
cy.smartWait('@api');
cy.smartGet('.button').click();

// Import types for custom usage
import { healSelector, HealOptions } from 'cypress-healing';

const options: HealOptions = {
  priority: ['data-cy', 'aria-label'],
  logging: true
};

// Use in custom commands
const healed = healSelector('.old-selector', document, options);
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "types": ["cypress", "cypress-healing"]
  }
}
```

---

## Examples

### Basic Test with Auto-Healing
```javascript
describe('Login Flow', () => {
  it('should login with auto-healing', () => {
    cy.visit('/login');
    
    // These selectors will auto-heal if they break
    cy.smartGet('#username').type('user@example.com');
    cy.smartGet('#password').type('password123');
    cy.smartGet('.login-button').click();
    
    // Wait for login to complete
    cy.smartWait('@loginAPI');
    cy.smartWait('.loading', { action: 'disappear' });
    
    // Verify success
    cy.smartGet('[data-cy=dashboard]').should('be.visible');
  });
});
```

### Custom Healing Configuration
```javascript
// Use custom healing options for specific elements
cy.smartGet('.dynamic-element', {
  priority: ['text', 'aria-label'], // Try text first
  excludePatterns: ['^temp-', '^id-\\d+$'], // Exclude temporary classes
  maxTextLength: 30 // Limit text matching
}).click();
```

---

## Best Practices

### 1. Use Stable Selectors
```javascript
// BEST: data-cy attributes
cy.smartGet('[data-cy=submit]');

// GOOD: data-testid
cy.smartGet('[data-testid=user-form]');

// GOOD: aria-label (also helps accessibility)
cy.smartGet('[aria-label="Close dialog"]');

// AVOID: Dynamic IDs and classes
cy.smartGet('#user-123456'); // Will need healing
```

### 2. Configure Exclusion Patterns
Add patterns for dynamic content in your config:
```json
{
  "heuristics": {
    "excludePatterns": [
      "^ember-",      // Ember.js IDs
      "^react-",      // React IDs
      "^ng-",         // Angular IDs
      "^vue-",        // Vue.js IDs
      "^[0-9]+$",     // Pure numeric IDs
      "^temp-",       // Temporary classes
      "[0-9]{13}"     // Timestamps
    ]
  }
}
```

### 3. Review Healing Reports
- Check `cypress/healing-report.html` after test runs
- Update tests with healed selectors when patterns emerge
- Use reports to identify unstable selectors in your app

### 4. Combine with Page Objects
```javascript
class LoginPage {
  get username() { return cy.smartGet('[data-cy=username]'); }
  get password() { return cy.smartGet('[data-cy=password]'); }
  get submitBtn() { return cy.smartGet('[data-cy=login-submit]'); }
  
  login(email, password) {
    this.username.type(email);
    this.password.type(password);
    this.submitBtn.click();
    cy.smartWait('@loginAPI');
  }
}
```

---

## Troubleshooting

### Selectors Not Healing
1. Check if element exists in DOM
2. Verify configuration file is loaded
3. Check console for healing attempts
4. Ensure heuristics match your app's patterns

### AI Healing Not Working
1. Verify API keys in config
2. Check network connectivity  
3. Ensure AI provider is enabled
4. Review console for API errors

### Build Issues
1. Run `npm install` to get dependencies
2. Run `npm run build` to compile TypeScript
3. Check that `dist/` folder exists
4. Verify TypeScript version compatibility

---
## License
MIT © 2025 **Sohail Mohammed** | [sohailcode.com](https://sohailcode.com) | [CodeTestFactory](https://sohailcode.com)
