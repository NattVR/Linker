/// <reference types="cypress" />
import { runA11yAudit } from './a11y-utils';

export {};

describe('Accesibilidad - Signup Empresas', () => {
  it('debe cumplir accesibilidaden signup de empresas', () => {
    cy.visit('/signup-empresa');
    cy.get('.signup-form').should('be.visible');

    runA11yAudit('signup-empresas');
  });
});
