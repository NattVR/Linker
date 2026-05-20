/// <reference types="cypress" />
import { runA11yAudit } from './a11y-utils';

export {};

describe('Accesibilidad - Signup', () => {
  it('debe cumplir accesibilidad en signup postulante', () => {
    cy.visit('/signup');
    cy.get('.signup-form').should('be.visible');

    runA11yAudit('signup');
  });
});
