/// <reference types="cypress" />

// Example Cypress test showing how to use the new healing features

describe('Cypress Healing - Usage Examples', () => {
  
  beforeEach(() => {
    cy.visit('https://example.com'); // Replace with your app URL
  });

  describe('Smart Wait Command (formerly waitFor)', () => {
    
    it('should wait for elements using smartWait', () => {
      // Wait for element to appear
      cy.smartWait('#loading-spinner', { 
        action: 'disappear',
        timeout: 5000,
        message: 'Waiting for loading to complete'
      });

      // Wait for API response
      cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
      cy.get('[data-cy=load-users]').click();
      cy.smartWait('@getUsers');

      // Simple millisecond wait
      cy.smartWait(1000);
    });

  });

  describe('Auto-Healing with smartGet', () => {
    
    it('should automatically heal broken selectors', () => {
      // This will try the selector first, then use heuristics if it fails
      cy.smartGet('.old-button-class').click();
      
      // With custom healing options
      cy.smartGet('#dynamic-id-12345', {
        priority: ['data-cy', 'aria-label', 'text'],
        excludePatterns: ['^[0-9]+$'],
        logging: true
      }).should('be.visible');

      // Heal form elements
      cy.smartGet('input[name=username]').type('test@example.com');
      cy.smartGet('input[name=password]').type('password123');
      
      // Heal button by text content
      cy.smartGet('.submit-btn').click();
    });

    it('should handle text-based healing', () => {
      // If the class changes, it will find by text content
      cy.smartGet('.login-button').click(); // Falls back to button:contains("Login")
      
      // Works with links too
      cy.smartGet('.nav-link').click(); // Falls back to a:contains("Navigation")
    });

    it('should prioritize stable selectors', () => {
      // Priority order: data-cy > data-testid > aria-label > role > text > label > class > id
      
      // Best practice: add data-cy attributes
      cy.smartGet('[data-cy=submit]').click();
      
      // Falls back to aria-label if data-cy not found
      cy.smartGet('[aria-label="Close dialog"]').click();
      
      // Falls back to role
      cy.smartGet('[role=button]').first().click();
    });

  });

  describe('Legacy getLoc with manual fallbacks', () => {
    
    it('should use fallback selectors when primary fails', () => {
      // Define fallback selectors manually
      cy.getLoc('.primary-selector', [
        '[data-cy=fallback]',
        '#secondary-id',
        'button:contains("Submit")'
      ]).click();
    });

  });

  describe('AI-Powered Healing (when configured)', () => {
    
    it('should use AI providers when heuristics fail', () => {
      // Configure AI in src/config/healing.config.json
      // Set api keys for OpenAI, Gemini, etc.
      
      // If heuristics fail, AI will suggest a selector
      cy.smartGet('.completely-changed-selector').should('exist');
    });

  });

  describe('Healing Report', () => {
    
    after(() => {
      // Generate healing report after tests
      cy.task('generateHealingReport');
      
      // View healed selectors
      cy.task('getHealedSelectors').then((selectors) => {
        console.log('Healed selectors:', selectors);
      });
    });

    it('should track all healed selectors', () => {
      // All healing is automatically tracked
      cy.smartGet('.broken-1').click();
      cy.smartGet('.broken-2').type('text');
      cy.smartGet('.broken-3').should('be.visible');
      
      // Report will be generated at cypress/healing-report.html
    });

  });

  describe('Best Practices', () => {
    
    it('should use data attributes for stable selectors', () => {
      // Best: data-cy attributes
      cy.smartGet('[data-cy=user-profile]').click();
      
      // Good: data-testid
      cy.smartGet('[data-testid=submit-form]').click();
      
      // Good: aria-label for accessibility
      cy.smartGet('[aria-label="User menu"]').click();
    });

    it('should configure exclusion patterns for dynamic content', () => {
      // Configure in healing.config.json to exclude:
      // - Dynamic IDs like "ember-123", "react-456"
      // - Timestamp-based classes
      // - Random generated attributes
      
      cy.smartGet('.user-card', {
        excludePatterns: ['^ember-', '^react-', '^ng-', '[0-9]{13}']
      }).should('exist');
    });

  });

});