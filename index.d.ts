/// <reference types="cypress" />

declare module 'cypress-healing' {
  // Healing options type
  export interface HealOptions {
    priority?: string[];
    excludePatterns?: string[];
    logging?: boolean;
    maxTextLength?: number;
    minTextLength?: number;
  }

  // Healing result type
  export interface HealingResult {
    original: string;
    healed: string | null;
    method: 'heuristic' | 'ai' | 'manual' | 'failed';
    timestamp: number;
  }

  // Main healing function
  export function healSelector(
    failingSelector: string,
    dom: Document,
    options?: Partial<HealOptions>
  ): string | null;

  // Generate smart selector for element
  export function generateSmartSelector(
    element: Element,
    options?: Partial<HealOptions>
  ): string | null;

  // Plugin registration
  export function registerHealingPlugin(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions
  ): Cypress.PluginConfigOptions;
}

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Get element with smart auto-healing capability using heuristics and AI
     * @param selector - CSS selector or jQuery selector
     * @param options - Options including healing options and standard Cypress options
     * @example cy.smartGet('.old-selector').click()
     */
    smartGet(
      selector: string,
      options?: Partial<
        Loggable & 
        Timeoutable & 
        Withinable & 
        Shadow & {
          priority?: string[];
          excludePatterns?: string[];
          logging?: boolean;
          maxTextLength?: number;
          minTextLength?: number;
        }
      >
    ): Chainable<JQuery<HTMLElement>>;

    /**
     * Smart wait command that replaces waitFor to avoid conflicts with Cypress 14+
     * @param target - Selector string, API alias, or milliseconds
     * @param options - Wait options
     * @example cy.smartWait('@api')
     * @example cy.smartWait('.spinner', { action: 'disappear' })
     * @example cy.smartWait(1000)
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
     * Get element with fallback selectors (legacy healing)
     * @param selector - Primary selector
     * @param fallbackSelectors - Array of fallback selectors
     * @deprecated Use smartGet for better auto-healing
     * @example cy.getLoc('.primary', ['.fallback1', '.fallback2'])
     */
    getLoc(
      selector: string,
      fallbackSelectors?: string[]
    ): Chainable<JQuery<HTMLElement>>;

    /**
     * Legacy waitFor command
     * @deprecated Use smartWait instead to avoid Cypress 14+ conflicts
     */
    waitFor(
      target: string | number,
      options?: {
        timeout?: number;
        message?: string;
        action?: 'appear' | 'disappear';
      }
    ): Chainable<any>;
  }
}
