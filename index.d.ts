/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    getLoc(
      selector: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<JQuery<HTMLElement>>;

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