# Changelog

All notable changes to cypress-healing will be documented in this file.

## [0.2.1] - 2025-09-28

### 🎉 Command Naming Update
- **RENAMED**: `cy.healGet()` → `cy.smartGet()` for better consistency
- Creates cohesive "smart" command family with `cy.smartWait()`
- All functionality remains the same, only the name has changed

## [0.2.0] - 2025-09-28

### 🎆 Major Release - AI-Powered Healing & Cypress 14+ Compatibility

### ⚠️ Breaking Changes
- **RENAMED**: `cy.waitFor()` → `cy.smartWait()` to avoid conflicts with Cypress 14+
  - All existing tests using `waitFor` need to be updated
  - `waitFor` is still available but deprecated

### ✨ New Features
- **AI-Powered Healing** 🤖
  - Support for OpenAI GPT-4
  - Google Gemini integration
  - GitHub Copilot (default)
  - Cursor AI support
  - Warp terminal AI integration

- **New `cy.smartGet()` Command** 🎯
  - Intelligent auto-healing with heuristics
  - Automatic selector recovery
  - Configurable healing priorities
  - Custom exclusion patterns

- **TypeScript Support** 📦
  - Full TypeScript rewrite
  - Proper type definitions
  - IDE IntelliSense support

- **Enhanced Configuration** ⚙️
  - `src/config/healing.config.json` for centralized settings
  - Configurable healing priorities
  - AI provider settings
  - Heuristic customization

### 🔧 Improvements
- **Smarter Heuristic Healing**
  - Priority-based selector fallbacks
  - Text content matching
  - ARIA label detection
  - Role-based selection
  - Stable class identification
  - Dynamic ID exclusion

- **Better Reporting**
  - Enhanced HTML reports with statistics
  - Healing method breakdown (heuristic/AI/manual)
  - Timestamp tracking
  - Programmatic report access via tasks

- **Project Structure**
  - Organized TypeScript modules
  - Separate utilities and services
  - Clean build process
  - Example usage files

### 📝 Documentation
- Comprehensive README update
- Migration guide from v0.1.x
- AI configuration examples
- Best practices section
- Troubleshooting guide
- Code examples

### 🐛 Bug Fixes
- Fixed compatibility issues with Cypress 14+
- Improved error handling in healing strategies
- Better selector verification

### 📦 Dependencies
- Added OpenAI SDK support
- Added Google Generative AI support
- TypeScript as dev dependency
- Updated Cypress peer dependency to >=10.0.0

### 🔄 Migration Required
Users upgrading from v0.1.x need to:
1. Replace `cy.waitFor()` with `cy.smartWait()`
2. Update plugin registration to use `registerHealingPlugin`
3. Consider using `cy.smartGet()` instead of `cy.getLoc()` for better healing

### 📁 Files Changed
- `src/commands.ts` - New command implementations
- `src/selectorUtils.ts` - Heuristic healing logic
- `src/healingService.ts` - AI integration and orchestration
- `src/config/healing.config.json` - Configuration template
- `tsconfig.json` - TypeScript configuration
- `package.json` - Updated dependencies and scripts
- `README.md` - Complete documentation overhaul

---

## [0.1.1] - Previous Version
- Basic self-healing with `cy.getLoc()`
- Simple `cy.waitFor()` command
- Basic HTML reporting
- Manual fallback selectors

---

## Installation

```bash
npm install cypress-healing@latest
```

## Quick Start

```javascript
// Import in support file
import 'cypress-healing';

// Use new commands
cy.smartWait('.loading');
cy.smartGet('.button').click();
```

## Support

For issues and questions, visit: https://github.com/codetestfactory-sohail/cypress-healing