/// <reference types="cypress" />
import { runA11yAudit } from './a11y-utils';

export {};

describe('Accesibilidad - Login', () => {
  it('debe cumplir accesibilidad en login', () => {
    cy.visit('/login');
    cy.contains('h2', 'Iniciar Sesi').should('be.visible');

    runA11yAudit('login');
  });
});
