/// <reference types="cypress" />

import { healSelector, HealOptions } from './selectorUtils';
import { healingService } from './healingService';

// Extend Cypress chainable interface
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Smart wait command that replaces waitFor to avoid conflicts with Cypress 14+
       * @param target - Selector string (waits for element), alias string (waits for API), or number (waits milliseconds)
       * @param options - Wait options including timeout, message, and action
       */
      smartWait(
        target: string | number,
        options?: {
          timeout?: number;
          message?: string;
          action?: 'appear' | 'disappear';
        }
      ): Chainable<any>;

      /**
       * Get element with smart auto-healing capability
       * @param selector - CSS selector or jQuery selector
       * @param options - Options including healing options and standard Cypress options
       */
      smartGet(
        selector: string,
        options?: Partial<
          Cypress.Loggable & 
          Cypress.Timeoutable & 
          Cypress.Withinable & 
          Cypress.Shadow &
          HealOptions
        >
      ): Chainable<JQuery<HTMLElement>>;

      /**
       * Get element with fallback selectors (legacy healing)
       * @param selector - Primary selector
       * @param fallbackSelectors - Array of fallback selectors to try
       */
      getLoc(
        selector: string,
        fallbackSelectors?: string[]
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

// Smart Wait Command (renamed from waitFor)
Cypress.Commands.add('smartWait', (target: string | number, options = {}) => {
  const { timeout = 10000, message = '', action } = options;

  // Handle API alias wait
  if (typeof target === 'string' && target.startsWith('@')) {
    cy.log(`⏳ ${message || `Waiting for API call ${target}`} (timeout ${timeout}ms)`);
    return cy.wait(target, { timeout });
  }
  
  // Handle selector wait
  if (typeof target === 'string') {
    return cy.document().then((doc) => {
      const exists = doc.querySelector(target) !== null;
      const effectiveAction = action || (exists ? 'disappear' : 'appear');

      if (effectiveAction === 'appear') {
        cy.log(`⏳ ${message || `Waiting for ${target} to appear`} (timeout ${timeout}ms)`);
        return cy.get(target, { timeout }).should('exist');
      } else {
        cy.log(`⏳ ${message || `Waiting for ${target} to disappear`} (timeout ${timeout}ms)`);
        return cy.get(target, { timeout }).should('not.exist');
      }
    });
  }
  
  // Handle millisecond wait
  if (typeof target === 'number') {
    cy.log(`⏳ ${message || `Waiting ${target}ms`}`);
    return cy.wait(target);
  }

  throw new Error('❌ cy.smartWait: target must be selector, alias, or number');
});

// Smart Get Command with auto-healing
Cypress.Commands.add('smartGet', (selector: string, options: any = {}): any => {
  const {
    timeout = 2000,
    log = true,
    // Extract healing-specific options
    priority,
    excludePatterns,
    logging,
    maxTextLength,
    minTextLength,
    ...cypressOptions
  } = options;

  const healOptions: Partial<HealOptions> = {
    priority,
    excludePatterns,
    logging,
    maxTextLength,
    minTextLength
  };

  // First, try to get the element normally with a short timeout
  return cy.get('body', { log: false }).then(($body) => {
    // Try original selector
    const elements = $body.find(selector);
    
    if (elements.length > 0) {
      if (log) {
        cy.log(`✅ Found element with selector: ${selector}`);
      }
      return cy.wrap(elements);
    }

    // If not found, try healing
    if (log) {
      cy.log(`🔍 Selector not found, attempting to heal: ${selector}`);
    }

    // Get the document for healing
    const doc = $body[0].ownerDocument;
    
    // Try heuristic healing first (synchronous)
    const healedSelector = healSelector(selector, doc, healOptions);
    
    if (healedSelector) {
      if (log) {
        cy.log(`🩹 Healed selector: ${selector} → ${healedSelector}`);
      }

      // Handle special case for :contains() selectors
      if (healedSelector.includes(':contains')) {
        // For :contains selectors, we need to use cy.contains
        const match = healedSelector.match(/(.*?):contains\("(.+?)"\)/);
        if (match) {
          const [, elementSelector, text] = match;
          if (elementSelector) {
            return cy.contains(elementSelector, text);
          } else {
            return cy.contains(text);
          }
        }
      }

      // Try the healed selector
      return cy.get(healedSelector, { timeout });
    }

    // If heuristic healing didn't work, try the healing service (supports AI)
    return cy.wrap(null, { log: false }).then(() => {
      return healingService.heal(selector, doc, healOptions).then(result => {
        if (result.healed) {
          if (log) {
            cy.log(`🤖 Healed via ${result.method}: ${selector} → ${result.healed}`);
          }

          // Handle :contains() for AI-healed selectors too
          if (result.healed.includes(':contains')) {
            const match = result.healed.match(/(.*?):contains\("(.+?)"\)/);
            if (match) {
              const [, elementSelector, text] = match;
              if (elementSelector) {
                return cy.contains(elementSelector, text);
              } else {
                return cy.contains(text);
              }
            }
          }

          return cy.get(result.healed, { timeout });
        }

        // No healing worked, fail with original selector for clarity
        if (log) {
          cy.log(`❌ No healing strategy worked for: ${selector}`);
        }
        return cy.get(selector, { timeout });
      });
    });
  });
});

// Legacy getLoc command with manual fallback selectors
Cypress.Commands.add('getLoc', (selector: string, fallbackSelectors: string[] = []) => {
  // Build array of selectors to try
  const selectorsToTry = [selector, ...fallbackSelectors];
  
  let lastError: Error | null = null;
  let attemptCount = 0;
  const maxAttempts = selectorsToTry.length;

  // Function to try the selectors
  const trySelectors = (): any => {
    if (attemptCount >= maxAttempts) {
      // All selectors failed
      cy.log(`❌ All selectors failed. Tried: ${selectorsToTry.join(', ')}`);
      throw lastError || new Error(`Element not found with any selector: ${selectorsToTry.join(', ')}`);
    }

    const currentSelector = selectorsToTry[attemptCount];
    attemptCount++;
    
    return cy.get('body', { log: false }).then($body => {
      const elements = $body.find(currentSelector);
      
      if (elements.length > 0) {
        if (attemptCount > 1) {
          cy.log(`♻️ Using fallback selector: ${selector} → ${currentSelector}`);
        }
        return cy.wrap(elements);
      }
      
      // Try next selector
      return trySelectors();
    });
  };

  return trySelectors();
});

// Export commands for use in plugins if needed
export const commands = {
  smartWait: 'smartWait',
  smartGet: 'smartGet',
  getLoc: 'getLoc'
};
