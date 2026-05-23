declare module 'cypress-axe';

declare namespace Cypress {
  interface Chainable {
    injectAxe(): Chainable<void>;
    checkA11y(
      context?: string | Node | undefined,
      options?: Record<string, unknown>,
      violationCallback?: (violations: any[]) => void,
    ): Chainable<void>;
  }
}
