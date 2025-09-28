/// <reference types="cypress" />

// Import and register commands
import './commands';

// Export utilities and services
export { healSelector, HealOptions, loadHeuristicConfig, generateSmartSelector } from './selectorUtils';
export { healingService, HealingResult, HealingConfig } from './healingService';
export { commands } from './commands';

// Plugin function for Cypress configuration
export function registerHealingPlugin(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
  // Register task to generate healing report
  on('task', {
    generateHealingReport() {
      const { healingService } = require('./healingService');
      healingService.generateReport();
      return null;
    },
    
    clearHealedSelectors() {
      const { healingService } = require('./healingService');
      healingService.clearHealed();
      return null;
    },
    
    getHealedSelectors() {
      const { healingService } = require('./healingService');
      const selectors = healingService.getHealedSelectors();
      // Convert Map to object for serialization
      const result: Record<string, any> = {};
      selectors.forEach((value: any, key: string) => {
        result[key] = value;
      });
      return result;
    }
  });

  // After run hook to generate report
  on('after:run', () => {
    const { healingService } = require('./healingService');
    healingService.generateReport();
  });

  return config;
}

// Auto-register commands when imported
if (typeof Cypress !== 'undefined' && Cypress.Commands) {
  console.log('🩹 Cypress Healing: Commands registered (smartWait, smartGet, getLoc)');
}
