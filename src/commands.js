import { getHealedSelector, tryHealing } from './healing';

Cypress.Commands.add('waitFor', (target, options = {}) => {
  const { timeout = 10000, message = '', action } = options;

  if (typeof target === 'string' && target.startsWith('@')) {
    cy.log(`⏳ ${message || `Waiting for API call ${target}`} (timeout ${timeout}ms)`);
    cy.wait(target, { timeout });
  } else if (typeof target === 'string') {
    cy.document().then((doc) => {
      const exists = doc.querySelector(target) !== null;
      const effectiveAction = action || (exists ? 'disappear' : 'appear');

      if (effectiveAction === 'appear') {
        cy.log(`⏳ ${message || `Waiting for ${target} to appear`} (timeout ${timeout}ms)`);
        cy.get(target, { timeout }).should('exist');
      } else {
        cy.log(`⏳ ${message || `Waiting for ${target} to disappear`} (timeout ${timeout}ms)`);
        cy.get(target, { timeout }).should('not.exist');
      }
    });
  } else if (typeof target === 'number') {
    cy.log(`⏳ ${message || `Waiting ${target}ms`}`);
    cy.wait(target);
  } else {
    throw new Error('❌ cy.waitFor: target must be selector, alias, or number');
  }
});

Cypress.Commands.add('getLoc', (selector, options) => {
  const healed = getHealedSelector(selector);
  if (healed) {
    cy.log(`♻️ Using healed selector: ${selector} → ${healed}`);
    return cy.get(healed, options);
  }

  return cy.get(selector, options).catch(() => {
    const autoHealed = tryHealing(selector);
    if (autoHealed) {
      cy.log(`🩹 Healing applied: ${selector} → ${autoHealed}`);
      return cy.get(autoHealed, options);
    }
    throw new Error(`❌ No healing strategy worked for ${selector}`);
  });
});